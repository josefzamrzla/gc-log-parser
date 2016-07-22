var GcLogParser = require('./');
const spawn = require('child_process').spawn;

var gc = new GcLogParser();
gc.on('stats', function (stats) {
	console.log(stats);
});

var child = spawn('node', ['--trace_gc', '--trace_gc_verbose', '--trace_gc_nvp', '--max_old_space_size=100', 'watched_script.js']);
child.stdout.on('data', function (data) {
	data.toString().trim().split('\n').forEach(function (line) {
		gc.parse(line);
	});
});
console.log('Waiting for gc output');