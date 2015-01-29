"use strict";
var http = require("http");
var https = require("https");
var nodeStatic = require("node-static");
var portscanner = require("portscanner");

var fileServer = new nodeStatic.Server(__dirname);
var host = "127.0.0.1";
var httpServers = {};



function getAvailablePort(callback)
{
	portscanner.findAPortNotInUse(3000, 3030, host, function(error, port)
	{
		if (error) throw error;
		callback(port);
	})
}



function getUrl(port, schemeRelative)
{
	if (schemeRelative !== true)
	{
		return "http://"+host+":"+port;
	}
	else
	{
		return "//"+host+":"+port;
	}
}



function startHttpServer(callback)
{
	getAvailablePort( function(port)
	{
		httpServers[port] = http.createServer( function(request, response)
		{
			request.addListener("end", function()
			{
				fileServer.serve(request, response, function(error, result)
				{
					if (error !== null)
					{
						response.writeHead(error.status, error.headers);
						response.end();
					}
				});
			}).resume();
		}).listen(port, host);
		
		callback(port);
	});
}



function startHttpServers(numServers, callback)
{
	var ports = [];
	var absoluteUrls = [];
	var schemeRelativeUrls = [];
	
	/*if (numServers < 1)
	{
		callback(ports, urls);
		return;
	}*/
	
	function started(port)
	{
		ports.push(port);
		absoluteUrls.push( getUrl(port) );
		schemeRelativeUrls.push( getUrl(port,true) );
		
		if (ports.length < numServers)
		{
			startHttpServer(started);
		}
		else
		{
			callback(ports, absoluteUrls, schemeRelativeUrls);
		}
	}
	
	startHttpServer(started);
}



function stopHttpServer(port, callback)
{
	httpServers[port].close( function()
	{
		delete httpServers[port];
		
		callback();
	});
}



function stopHttpServers(ports, callback)
{
	/*if (ports.length === 0)
	{
		callback();
		return;
	}*/
	
	function stopped()
	{
		if (++count >= ports.length)
		{
			callback();
		}
	}
	
	var count = 0;
	
	for (var i=0; i<ports.length; i++)
	{
		stopHttpServer(ports[i], stopped);
	}
}



// Public API



function logLinkObj(linkObj)
{
	linkObj.response = {};	// for easier logging
	console.log(linkObj);
}



function startConnections(callback)
{
	startHttpServers(2, function(ports, absoluteUrls, schemeRelativeUrls)
	{
		getAvailablePort( function(port)
		{
			callback(
			{
				realPorts: ports,
				absoluteUrls: absoluteUrls,
				relativeUrls: schemeRelativeUrls,
				
				fakePort: port,
				fakeAbsoluteUrl: getUrl(port),
				fakeRelativeUrl: getUrl(port,true)
			});
		});
	});
}



function stopConnections(ports, callback)
{
	stopHttpServers(ports, callback);
}



module.exports = 
{
	logLinkObj: logLinkObj,
	startConnections: startConnections,
	stopConnections: stopConnections
};
