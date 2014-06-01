var _ = require('lodash'),
    url = require('url'),
    Promise = require('bluebird'),
    cheerio = require('cheerio'),
    request = Promise.promisify(require('request')),
    fs = Promise.promisifyAll(require('fs')),
    target = 'http://107.20.237.151:8081/logs/',
    room = '#ghost';

function LogDate(displayDate, url) {
    this.DisplayDate = displayDate;
    this.Url = url;
    this.Body = null;
}

function _getDirectoryHtml() {
    return request(target + encodeURIComponent(room)).spread(function (req, body) {
        return body;
    });
}

function _parseDirectoryHtml(body) {
    var $ = cheerio.load(body),
        dates = [];

    // Get Individual Dates
    $('.container > ul > li > a').each(function () {
        var $dayLink = $(this),
            dayUrl = $dayLink.attr('href'),
            dayDisplay = $dayLink.text();

        dates.push(new LogDate(dayDisplay, url.resolve(target + encodeURIComponent(room), dayUrl)));
    });

    // Assume dates are sorted descending by default, so reverse
    return dates.reverse();
}

function _getAllDatesHtml(logDates) {
    var ops = [];

    _.each(logDates, function (logDate) {
        ops.push(request(logDate.Url).spread(function (req, body) {
            console.log('Loaded: ' + logDate.DisplayDate);
            logDate.Body = body;
            return logDate;
        }));
    });

    return Promise.all(ops);
}

function _parseAllDatesHtml(logDates) {
    var html = '';

    _.each(logDates, function (logDate) {
        var $ = cheerio.load(logDate.Body);

        html += $('.container').html();

        console.log('Parsed: ' + logDate.DisplayDate);
    });

    return fs.writeFile('log.html', html);
}

function getLogs() {
    return _getDirectoryHtml()
        .then(_parseDirectoryHtml)
        .then(_getAllDatesHtml)
        .then(_parseAllDatesHtml)
        .then(function () {
            console.log('  -----  ');
            console.log('Complete!');
        });
}

getLogs();