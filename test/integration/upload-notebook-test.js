/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

var sinon = require('sinon');
var chai = require('chai').use(require('sinon-chai'));
var expect = chai.expect;
var request = require('request');
var fs = require('fs');
var path = require('path');
var urljoin = require('url-join');

var appUrl = process.env.APP_URL;
var uploadUrl;

describe('upload notebook', function() {
    beforeEach(function() {
        var uploadName = 'it_' + Math.floor(Math.random() * 100000000);
        uploadUrl = urljoin(appUrl, '/notebooks', uploadName);
    });

    it('should upload a notebook', function(done) {
        var datapath = path.join(__dirname, 'upload-notebook-test.ipynb');
        var formData = {
            file: fs.createReadStream(datapath)
        };

        request.post({
            url: uploadUrl,
            formData: formData
        }, function(err, res, body) {
            expect(res.statusCode).to.equal(201);

            request.get({
                url: uploadUrl
            }, function(err, res, body) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });
    });

    it('should return an error when attempting to upload a non-notebook file', function(done) {
        var datapath = path.join(__dirname, 'upload-notebook-test.notanipynb');
        var formData = {
            file: fs.createReadStream(datapath)
        };

        request.post({
            url: uploadUrl,
            formData: formData
        }, function(err, res, body) {
            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('should return an error when attempting to upload multiple files', function(done) {
        var datapath = path.join(__dirname, 'upload-notebook-test.ipynb');
        var datapath2 = path.join(__dirname, 'upload-notebook-test-2.ipynb');
        var formData = {
            file: fs.createReadStream(datapath),
            file2: fs.createReadStream(datapath2)
        };

        request.post({
            url: uploadUrl,
            formData: formData
        }, function(err, res, body) {
            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('should not delete the existing file when too many form parts', function(done) {
        var datapath = path.join(__dirname, 'upload-notebook-test.ipynb');
        var formData = {
            file: fs.createReadStream(datapath)
        };
        var badFormData = {
            file: fs.createReadStream(datapath),
            foo: 'bar'
        };

        request.post({
            url: uploadUrl,
            formData: formData
        }, function(err, res, body) {
            expect(res.statusCode).to.equal(201);

            request.post({
                url: uploadUrl,
                formData: badFormData
            }, function(err, res, body) {
                expect(res.statusCode).to.equal(201);

                request.get({
                    url: uploadUrl
                }, function(err, res, body) {
                    expect(res.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });

    it('should not cache notebook when upload overrides existing file', function(done) {
        var datapath = path.join(__dirname, 'upload-notebook-test.ipynb');
        var datapath2 = path.join(__dirname, 'upload-notebook-test-2.ipynb');
        var formData = {
            file: fs.createReadStream(datapath)
        };
        var formData2 = {
            file: fs.createReadStream(datapath2)
        };

        request.post({
            url: uploadUrl,
            formData: formData
        }, function(err, res, body) {
            expect(res.statusCode).to.equal(201);

            request.post({
                url: uploadUrl,
                formData: formData2
            }, function(err, res, body) {
                expect(res.statusCode).to.equal(201);

                request.get({
                    url:uploadUrl
                }, function(err, res, body) {
                    expect(res.statusCode).to.equal(200);
                    expect(body.indexOf('2nd Upload notebook test')).to.be.above(-1);
                    done();
                });
            });
        });

    });
});
