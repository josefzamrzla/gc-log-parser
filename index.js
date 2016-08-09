"use strict";
var util = require('util'), events = require('events');

var GcLogParser = function () {
	this.types = [
		{
			name: 'Head, nvp',
			required: [3, 6],
			r: /^(\[[^\]]+\])(\s+)([0-9]+)(\s+)ms:(\s+)(.*)$/,
			fn: this._parseHead
		},
		{
			name: 'Head, nvp (node v4)',
			required: [5, 8],
			r: /^(\[[^\]]+\])(\s+)(\[[^\]]+\])(\s+)([0-9]+)(\s+)ms:(\s+)(.*)$/,
			fn: this._parseHeadv4
		},
		{
			name: 'Spaces',
			required: [2, 5, 9, 13],
			r: /^(\[[^\]]+\])([^,]+),(\s+)used:(\s+)(\d+)(\s+)KB,(\s+)available:(\s+)(\d+)(\s+)KB,(\s+)committed:(\s+)(\d+)/,
			fn: this._parseSpaces
		},
		{
			name: 'Memory allocator',
			required: [2, 5, 9],
			r: /^(\[[^\]]+\])([^,]+),(\s+)used:(\s+)(\d+)(\s+)KB,(\s+)available:(\s+)(\d+)/,
			fn: this._parseAllocator
		},
		{
			name: 'Time spent in GC',
			required: [5],
			r: /^(\[[^\]]+\])(\s+)Total([^:]+):(\s+)([0-9\.]+)/,
			fn: this._parseTail,
			emit: true
		},
		{
			name: 'External memory',
			required: [2, 4],
			r: /^(\[[^\]]+\])([\s]+External[^:]+):(\s+)(\d+)/,
			fn: this._parseExternalMem
		},
		{
			name: 'Other',
			required: [],
			r: /^\[[^\]]+\]/,
			fn: this._noop
		}
	];

	this.start = Date.now();
	this.stats = {};
	this._reset();
};

util.inherits(GcLogParser, events.EventEmitter);

GcLogParser.prototype.parse = function (line) {
	for (var i = 0; i < this.types.length; i++) {
		var matches = line.match(this.types[i].r);
		if (matches) {

			var errors = this._validate(matches, this.types[i].required);
			if (errors === null) {
				try {
					this.types[i].fn.call(this, matches);
				} catch (e) {
					this.emit('error', e);
				}
			} else {
				this.emit('error', new Error(
					'Missing keys: [' + errors.join(',') + '] for type: ' + this.types[i].name +
					'. Required: [' + this.types[i].required.join(',') + ']'));
			}

			if (this.types[i].emit) {
				this.emit('stats', this.stats);
				this._reset();
			}

			return true;
		}
	}

	return false;
};

GcLogParser.prototype._parseHead = function (matches) {
	var self = this;
	this.stats.time = parseInt(matches[3], 10);
	this.stats.start = this.start + this.stats.time;

	matches[6].trim().split(/\s+/).forEach(function (item) {
		var parts = item.split('=');
		if (/[a-zA-Z]+/.test(parts[1])) {
			self.stats.nvp[parts[0]] = parts[1];
		} else if (parts[1].indexOf('%') > -1) {
			self.stats.nvp.percs[parts[0]] = parseFloat(parts[1] || '0');
		} else {
			self.stats.nvp.abs[parts[0]] = parseFloat(parts[1] || '0');
		}
	});

	switch (this.stats.nvp.gc) {
		case 's':
			this.stats.type = 'Scavenge';
			break;
		case 'ms':
			this.stats.type = 'Mark-sweep';
			break;
		default:
			this.stats.type = this.stats.nvp.gc;
	}
};

GcLogParser.prototype._parseHeadv4 = function (matches4) {
	var matches = [];
	matches[3] = matches4[5];
	matches[6] = matches4[8];
	this._parseHead(matches);
};

GcLogParser.prototype._parseSpaces = function (matches) {
	this.stats.spaces.push({
		name: matches[2].trim(),
		used: parseInt(matches[5], 10),
		available: parseInt(matches[9], 10),
		committed: parseInt(matches[13], 10)
	});
};

GcLogParser.prototype._parseAllocator = function (matches) {
	matches[13] = '0';
	this._parseSpaces(matches);
};

GcLogParser.prototype._parseExternalMem = function (matches) {
	this.stats[matches[2].trim().replace(/\s+/g, '_').toLowerCase()] = parseInt(matches[4], 10);
};

GcLogParser.prototype._parseTail = function (matches) {
	this.stats.took = parseFloat(matches[5]);
};

GcLogParser.prototype._noop = function () {};

GcLogParser.prototype._reset = function () {
	this.stats = {
		nvp: {
			percs: {},
			abs: {}
		},
		spaces: []
	};
};

GcLogParser.prototype._validate = function (matches, required) {
	if (!required.length) return null;

	var missing = [];
	required.forEach(function (key) {
		if (!(key in matches)) {
			missing.push(key);
		}
	});

	if (missing.length) return missing;

	return null;
};

module.exports = GcLogParser;