'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var filter = require('./index');

describe('filter()', function () {
	it('should filter files', function (cb) {
		var stream = filter('included.js');
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, 'included.js');
			cb();
		});

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/included.js'
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/ignored.js'
		}));

		stream.end();
	});

	it('should forward multimatch options', function (cb) {
		var stream = filter('*.js', {matchBase: true});
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].relative, 'nested/resource.js');
			cb();
		});

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/nested/resource.js'
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/nested/resource.css'
		}));

		stream.end();
	});

	it('should filter using a function', function (cb) {
		var stream = filter(function (file) {
			return file.path === 'included.js';
		});
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].path, 'included.js');
			cb();
		});

		stream.write(new gutil.File({path: 'included.js'}));
		stream.write(new gutil.File({path: 'ignored.js'}));
		stream.end();
	});

	it('should filter files with negate pattern and leading dot', function (cb) {
		var stream = filter(['!*.json', '!*rc'], {dot: true});
		var buffer = [];

		stream.on('data', function (file) {
			buffer.push(file);
		});

		stream.on('end', function () {
			assert.equal(buffer.length, 2);
			assert.equal(buffer[0].path, 'included.js');
			assert.equal(buffer[1].path, 'app.js');
			cb();
		});

		stream.write(new gutil.File({path: 'included.js'}));
		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: '.jshintrc'}));
		stream.write(new gutil.File({path: 'app.js'}));
		stream.end();
	});
});

describe('filter.restore()', function () {
	it('should bring back the previously filtered files', function (cb) {
		var stream = filter('*.json');
		var buffer = [];

		var completeStream = stream.pipe(stream.restore());
		completeStream.on('data', function (file) {
			buffer.push(file);
		});

		completeStream.on('end', function () {
			assert.equal(buffer.length, 3);
			assert.equal(buffer[0].path, 'app.js');
			assert.equal(buffer[1].path, 'package.json');
			assert.equal(buffer[2].path, 'package2.json');
			cb();
		});

		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: 'app.js'}));
		stream.write(new gutil.File({path: 'package2.json'}));
		stream.end();
	});

	it('should work when using multiple filters', function (cb) {
		var streamFilter1 = filter(['*.json', '*.js']);
		var streamFilter2 = filter(['*.json']);
		var buffer = [];

		var completeStream = streamFilter1
			.pipe(streamFilter2)
			.pipe(streamFilter1.restore())
			.pipe(streamFilter2.restore());

		completeStream.on('data', function (file) {
			buffer.push(file);
		});

		completeStream.on('end', function () {
			assert.equal(buffer.length, 3);
			assert.equal(buffer[0].path, 'app.js');
			assert.equal(buffer[1].path, 'main.css');
			assert.equal(buffer[2].path, 'package.json');
			cb();
		});

		streamFilter1.write(new gutil.File({path: 'package.json'}));
		streamFilter1.write(new gutil.File({path: 'app.js'}));
		streamFilter1.write(new gutil.File({path: 'main.css'}));
		streamFilter1.end();
	});

	it('should end when using the end option', function (cb) {
		var stream = filter('*.json');
		var restoreStream = stream.restore({end: true});
		var buffer = [];

		restoreStream.on('data', function (file) {
			buffer.push(file);
		});

		restoreStream.on('end', function () {
			assert.equal(buffer.length, 1);
			assert.equal(buffer[0].path, 'app.js');
			cb();
		});

		stream.write(new gutil.File({path: 'package.json'}));
		stream.write(new gutil.File({path: 'app.js'}));
		stream.write(new gutil.File({path: 'package2.json'}));
		stream.end();
	});
});

