/* 
============================
   Javascript Webcrawler
============================
*/

/*
====== Settings ========
*/
var URL_TO_CRAWL;
var KEYWORD = "test";
var MAX_PAGES_TO_VISIT = 100;
var CRAWL_TIL_YOU_DIE = true;
var LINK_TYPE = 1;   // 1 - relative links, 2 - absolute links, 3 - Both

if (!process.argv[2]) {
	console.log("No URL to crawl.");
	return;
} else {
	URL_TO_CRAWL = process.argv[2];
}
if (!process.argv[3])
	console.log("No crawl type, default is 1 (relative links).");
else
	LINK_TYPE = process.argv[3];

if (LINK_TYPE == 99)
	URL_TO_CRAWL = "https://play.google.com/store/search?q=munchkin";

if (!process.argv[4])
	console.log("No Keyword.");
else
	KEYWORD = process.argv[4];
/*
====== Dependencies ========
*/
var request = require('request'); 
var cheerio = require('cheerio'); 
var URL     = require('url-parse');

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
		if(response == null || response.statusCode !== 200) {
			console.log("Server Response " + error);
			callback();
			return;
		}

		var $ = cheerio.load(body);
		if (LINK_TYPE == 99) {
			checkAppRank($);
			return;
		}

		//console.log("Page Title: " + $('title').text());
		var isWordFound = searchForWord($, KEYWORD);
		if (isWordFound) {
			printFoundWord(KEYWORD, url);
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

function printFoundWord(keyword, url) {
	console.log('===================================');
	console.log('Keyword ' + keyword + ' found at ' + url);
	console.log('===================================');
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

function checkAppRank($) {
	var apps = $(".card.no-rationale.square-cover.apps.small .details .title");
	var developers = $(".card.no-rationale.square-cover.apps.small .details .subtitle");
	var position = 0;
	var index = 1;
	apps.each(function() {
		var appName = $(this).attr('title');
		var devName = $($(this).next().children()[0]).attr('title');
		console.log(index + " - " + appName + " by " + devName);
		if (devName == "PedroRocha")
			position = index;
		index++;
	});
	console.log("=================================");
	console.log("App is in position " + position + " today.");
	console.log("=================================");
	return;
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