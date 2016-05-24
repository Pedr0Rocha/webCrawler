/* 
============================
   Javascript Webcrawler
============================
*/

/*
====== Dependencies ========
*/
var request = require('request'); // Request is used to make HTTP requests.
var cheerio = require('cheerio'); // Cheerio is used to parse and select HTML elements on the page.
var URL     = require('url-parse'); // URL is used to parse URLs.

/*
====== Settings ========
*/
var URL_TO_CRAWL = "http://www.url.com";
var KEYWORD = "test";
var MAX_PAGES_TO_VISIT = 100;
var CRAWL_TIL_YOU_DIE = true;
var LINK_TYPE = 1;   // 1 - Only relative links
					 // 2 - Only absolute links
					 // 3 - Both

/*
====== Run ========
*/
var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(URL_TO_CRAWL);
var baseUrl = url.protocol + "//" + url.hostname;

pagesToVisit.push(URL_TO_CRAWL);
crawl();


/*
====== Crawler ========
*/
function crawl() {
	if (!CRAWL_TIL_YOU_DIE) {
		if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
			console.log("Done, page limit reached.");
			return;
		}
	}
	var nextPage = pagesToVisit.pop();
	if (nextPage != null){
		if (nextPage in pagesVisited)
			crawl(); // Page already visited.
		else 
			visitPage(nextPage, crawl); // New page to visit.
	}
}

function visitPage(url, callback) {
	pagesVisited[url] = true;
	numPagesVisited++;

	console.log("Crawling: " + url);
	request(url, function(error, response, body) {
		//console.log("Status code: " + response.statusCode);
		if(response == null || response.statusCode !== 200) {
			//console.log("Error! " + error);
			callback();
			return;
		}

		var $ = cheerio.load(body);
		//console.log("Page Title: " + $('title').text());
		var isWordFound = searchForWord($, KEYWORD);
		if (isWordFound) {
			console.log('===================================');
			console.log('Keyword ' + KEYWORD + ' found at ' + url);
			console.log('===================================');
			if (CRAWL_TIL_YOU_DIE || numPagesVisited <= MAX_PAGES_TO_VISIT) {
				collectLinks($);
				callback();
			}
		} else {
			collectLinks($);
			callback();
		}
	});
}

function searchForWord($, keyword) {
	var bodyText = $('html > body').text().toLowerCase();
	return (bodyText.indexOf(keyword.toLowerCase()) !== -1);
}

function collectRelativeLinks($) {
    var relativeLinks = $("a[href^='/']");
    //console.log("Found " + relativeLinks.length + " relative links.");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}

function collectAbsoluteLinks($) {
    var absoluteLinks = $("a[href^='http']");
    //console.log("Found " + absoluteLinks.length + " absolute links.");
    absoluteLinks.each(function() {
    	//console.log($(this).attr('href'));
        pagesToVisit.push($(this).attr('href'));
    });
}

function collectLinks($){
	if (LINK_TYPE == 1)
		collectRelativeLinks($);
	else if (LINK_TYPE == 2)
		collectAbsoluteLinks($);
	else if (LINK_TYPE == 3) {
		collectRelativeLinks($);
		collectAbsoluteLinks($);
	}
}