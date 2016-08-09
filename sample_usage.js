var GcLogParser = require('./');
var spawn = require('child_process').spawn;

var parser = new GcLogParser();
parser.on('stats', function (stats) {
	console.log(stats);
});
parser.on('error', function (e) {
	console.error(e);
});

var child = spawn('node', ['--trace_gc', '--trace_gc_verbose', '--trace_gc_nvp', '--max_old_space_size=100', 'watched_script.js']);
child.stdout.on('data', function (data) {
	data.toString().trim().split('\n').forEach(function (line) {
		parser.parse(line);
	});
});
console.log('Waiting for gc output');