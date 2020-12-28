require.config({
    paths: {
        jquery: 'vendor/jquery/dist/jquery',
        underscore: 'vendor/underscore/underscore',
        goldenlayout: 'vendor/golden-layout/dist/goldenlayout',
        events: 'vendor/eventEmitter/EventEmitter',
        clipboard: 'vendor/clipboard/dist/clipboard',
        'raven-js': 'vendor/raven-js/dist/raven',
        promise: 'vendor/es6-promise/es6-promise',
        vs: 'vendor/monaco-editor/dev/vs',
        worker: 'vendor/requirejs-web-workers/src/worker',
        jstree: 'vendor/jstree/dist/jstree',
        jsbeeb: 'jsbeeb',
        jsunzip: 'jsbeeb/lib/jsunzip',
        'webgl-debug': 'jsbeeb/lib/webgl-debug'
    },
    shim: {
        underscore: {exports: '_'},
        bootstrap: ['jquery']
    }
});

var eventHub;
var emulator;
var project;
var beebasm;

function showTab(tabContentId) {
    $('#tab_dis').toggleClass('active', tabContentId === 'dis');
    $('#tab_mem').toggleClass('active', tabContentId === 'mem');
    $('#tab_hw').toggleClass('active', tabContentId === 'hw');
    $('#dis').toggle(tabContentId === 'dis');
    $('#mem').toggle(tabContentId === 'mem');
    $('#hw').toggle(tabContentId === 'hw');
}

function buildAndBoot() {
    //this.project.files.update('starquake/starquake.asm', this.editor.getValue());
    beebasm(project);
            //console.log("compiled:", e);
/*                this.hub.emit('compiled', e);
            if (e.status === 0) {
                this.hub.emit('start', e);
            } else {
                var lineNum = parseInt(e.stderr[0].match(/(?<=:)\d+(?=:)/)[0]);
                monaco.editor.setModelMarkers(this.editor.getModel(), 'test', [{
                    startLineNumber: lineNum,
                    startColumn: 1,
                    endLineNumber: lineNum,
                    endColumn: 1000,
                    message: e.stderr[3],
                    severity: monaco.MarkerSeverity.Error
                }]);
            }
        }, this)).catch(function (e) {
            console.log("error", e);
            this.hub.emit('compiled', e);
        });*/
};

define(function (require) {
    "use strict";
    var _ = require('underscore');
    var GoldenLayout = require('goldenlayout');
    var $ = require('jquery');
    var Project = require('./project');
    var Console = require('./console');
    var Editor = require('./editor');
    var Emulator = require('./emulator');
    var Tree = require('./tree');
    project = new Project('./starquake', 'starquake.asm', 'quake');
    beebasm = require('beebasm-cli');
    var projfiles = require('./starquake');

    var treeAndEditor = {
        type: 'row',
        height: 80,
        content: [
        {
            type: 'stack', 
            hasHeaders: false, 
            width: 25,  
            content: [
                {type: 'component', width: 100, componentName: 'tree', componentState: {}},
            ]
        }, 
        {
            type: 'stack', 
            id:'editorStack', 
            width: 75, 
            content: []
        }
        ]
    };
    

    var leftCol = {
        type: 'column',
        width: 60, 
        content: [
            treeAndEditor,
            {
            type: 'stack', 
            hasHeaders: false, 
            width: 40,  
            content: [
                {
                type: 'component',
                componentName: 'console', componentState: {}
                }
            ] 
            }
        ]
    }
    var rightCol = {
        type: 'column',
        width: 40, 
        content: 
        [
            {
            type: 'stack', 
            height: 50, 
            hasHeaders: false, 
            content: [
                {type: 'component', componentName: 'emulator', componentState: {}}
            ]
            },
            {
            type: 'stack', 
            hasHeaders: false, 
            content: [
                {type: 'component', componentName: 'debugger', componentState: {}}
            ]
            },
        ],
    };

    
    var config = {
        settings: {hasHeaders: true, showPopoutIcon: false, showMaximiseIcon: false, showCloseIcon: false},
        content: [
            {
            type: 'row',
            content: [
                leftCol, rightCol
            ]
        }]
    };


    var root = $("#root");
    var layout = new GoldenLayout(config, root);
    eventHub = layout.eventHub;
    layout.registerComponent('tree', function (container, state) {
        return new Tree(container, state);
    });
    layout.registerComponent('editor', function (container, state) {
        return new Editor(container, state);
    });
    layout.registerComponent('emulator', function (container, state) {
        emulator = new Emulator(container, state);
        return emulator;
    });
    layout.registerComponent('console', function (container, state) {
        return new Console(container, state);
    });
    layout.registerComponent('debugger', function( container, state ){
        container.getElement().load('debug.html'); 
    });
   

    eventHub.on('fileSelected',  function (fileNode) {
        var editorStack = layout.root.getItemsById('editorStack')[0];
        // If stack already has this file open, activate it
        for (let item of editorStack.contentItems) {
            if (item.config.componentState.file.id === fileNode.id) {
                editorStack.setActiveContentItem(item);
                return;
            }
        }
        // Add new editor item
        editorStack.addChild({
            type: 'component', width: 100, componentName: 'editor', 
            title: fileNode.text, componentState: {file: fileNode}
        });
    }, this);

    layout.init();

    function sizeRoot() {
        var height = $(window).height() - root.position().top;
        root.height(height);
        layout.updateSize();
    }

    setTimeout(()=>{
        emulator.init();
        $(window).resize(sizeRoot);
        sizeRoot();
    }, 100);

    eventHub.emit('projectChange', project);


});