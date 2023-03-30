const express = require('express')
const app = express()
const cron = require('node-cron')
const CloudStackClient = require('csclient');
const moment = require('moment')
const ExosacleClient =  require('./exoscale-snapshot-client')
var config = require('./config.json')

var api_key = config.mailgun.secretKey;
var domain = config.mailgun.domain;

var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});



const clients = config.clients

console.log("start snapshots cron")

cron.schedule('0 8 * * *', () => {
    clients.forEach(function(client) {
        let options = {
            apiKey: client.apiKey,
            secretKey: client.secretKey,
            baseUrl: "https://api.exoscale.ch/compute?",
        }
    
        var exoscaleClient = new ExosacleClient(options, client);
    
        exoscaleClient.on ('ready', () => {
            try{
                console.log("start snapshots")
                console.log(exoscaleClient.customer.name)
                let snapshots = exoscaleClient.executeSnapShots()
                snapshots.then((result) => {
                    console.log(result.logs)
                    sendResultsByEmail(result.logs, exoscaleClient.customer, "create")
                })
    
            } catch (err) {
                console.log(err)
            }
        });
    }, this);
});

cron.schedule('0 9 * * *', () => {
    clients.forEach(function(client) {
        let options = {
            apiKey: client.apiKey,
            secretKey: client.secretKey,
            baseUrl: "https://api.exoscale.ch/compute?",
        }
    
        var exoscaleClient = new ExosacleClient(options, client);
    
        exoscaleClient.on ('ready', () => {
            try{
                console.log("start cleaning snapshots")
                console.log(exoscaleClient.customer.name)
                let snapshots = exoscaleClient.executeCleanSnapShots()
                snapshots.then((result) => {
                    console.log(result.logs)
                    sendResultsByEmail(result.logs, exoscaleClient.customer, "clean")
                })
    
            } catch (err) {
                console.log(err)
            }
        });
    }, this);
});

function sendResultsByEmail(results,customer, type){
    let text = ""
    if(type =="clean"){
        text = "Snapshots nettoyé avec succès"
    } else {
        text = "Snapshots efftués avec succès"
    }

    var data = {
        from: 'Cron snapshots <'+config.mailgun.notification_mail_from+'>',
        to: config.mailgun.notification_mail_to,
        subject: 'Snapshot Cron finished: '+customer.name,
        text: text
      };

      mailgun.messages().send(data, function (error, body) {
        console.log("mail sent");
      });
}