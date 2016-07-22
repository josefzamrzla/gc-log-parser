# V8 garbage collector tracing output parser

Parses GC tracing output into a JSON. 

## Sample usage

Run a watched script in a child process, read its output and print parsed GC stats.

```javascript
var GcLogParser = require('./');
var spawn = require('child_process').spawn;

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
```

## Sample output

```javascript
{
    nvp: {
        percs: {
            promotion_ratio: 86.6,
            average_survival_ratio: 86.7,
            promotion_rate: 96,
            semi_space_copy_rate: 2.3
        },
        abs: {
            pause: 8,
            mutator: 1752.9,
            reduce_memory: 0,
            external: 0,
            clear: 0,
            'clear.code_flush': 0,
            'clear.dependent_code': 0,
            'clear.global_handles': 0,
            'clear.maps': 0,
            'clear.slots_buffer': 0,
            'clear.store_buffer': 0.2,
            'clear.string_table': 0.1,
            'clear.weak_cells': 0,
            'clear.weak_collections': 0,
            'clear.weak_lists': 0,
            evacuate: 1.8,
            'evacuate.candidates': 0,
            'evacuate.clean_up': 0,
            'evacuate.new_space': 1,
            'evacuate.update_pointers': 0.8,
            'evacuate.update_pointers.between_evacuated': 0,
            'evacuate.update_pointers.to_evacuated': 0.3,
            'evacuate.update_pointers.to_new': 0.4,
            'evacuate.update_pointers.weak': 0.1,
            finish: 0,
            mark: 5.2,
            'mark.finish_incremental': 0,
            'mark.prepare_code_flush': 0.3,
            'mark.roots': 4.8,
            'mark.weak_closure': 0,
            sweep: 0,
            'sweep.code': 0,
            'sweep.map': 0,
            'sweep.old': 0,
            incremental_finalize: 0,
            steps_count: 2,
            steps_took: 3.8,
            longest_step: 3.8,
            finalization_steps_count: 1,
            finalization_steps_took: 0.2,
            finalization_longest_step: 0.2,
            incremental_marking_throughput: 1768425,
            total_size_before: 58556432,
            total_size_after: 15280912,
            holes_size_before: 408,
            holes_size_after: 463408,
            allocated: 43123360,
            promoted: 568528,
            semi_space_copied: 14808,
            nodes_died_in_new: 0,
            nodes_copied_in_new: 0,
            nodes_promoted: 8,
            new_space_allocation_throughput: 386,
            context_disposal_rate: 0,
            compaction_speed: 619911
        },
        gc: 'ms'
    },
    spaces: [
        {
            name: 'Memory allocator',
            used: 54308,
            available: 113628,
            committed: 0
        }, 
        {
            name: 'New space',
            used: 16,
            available: 1999,
            committed: 4096
        }, 
        {
            name: 'Old space',
            used: 2902,
            available: 452,
            committed: 4016
        }, 
        {
            name: 'Code space',
            used: 609,
            available: 0,
            committed: 2048
        }, 
        {
            name: 'Map space',
            used: 130,
            available: 0,
            committed: 1100
        }, 
        {
            name: 'Large object space',
            used: 11264,
            available: 112587,
            committed: 11304
        }, 
        {
            name: 'All spaces',
            used: 14922,
            available: 115039,
            committed: 22564
        }
    ],
    time: 2872,
    start: 1469179764050,
    type: 'Mark-sweep',
    external_memory_reported: 8,
    took: 10.5
}
```

## Compatibility

Tested on node 0.10.x, 0.12.x, 4.x and 6.x