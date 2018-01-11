'use strict';

const CloudStackClient = require('csclient');
const moment = require('moment')

/**
 * Class ExoscaleSnapshotClient
 * 
 * @class ExoscaleSnapshotClient
 * @extends {CloudStackClient}
 */
class ExoscaleSnapshotClient extends CloudStackClient {

	constructor(options,customer) {
        super(options);
        this.customer = customer;
        this.exclude = ["apptitude-test"];
        this.keepSnapshots = 5;
        this.snapshots = [];
        this.volumes = [];
        this.logs = []
        this.logs[this.customer.name] = [];
    }
    
    executeSnapShots(){
        return new Promise((success, reject) => {
                this.snapshotsAllVolume(() => {
                    let result = {
                        customer: this.customer,
                        logs: this.logs
                    }
                    success(result) ; // Yay! Everything went well!
                })
            }
        )
    }

    executeCleanSnapShots(){
        return new Promise((success, reject) => {
                this.cleanAll(() => {
                    let result = {
                        customer: this.customer,
                        logs: this.logs
                    }
                    success(result) ; // Yay! Everything went well!
                })
            }
        )
    }


    cleanAll(success) {
        this.listVolumes(() => {
            this.listSnapshots(() => {
                this.cleanSnapShots(success)
            })
        })
    }
    
    snapshotsAllVolume(success){        
        this.listVolumes(() => {
            this.listSnapshots(() => {
                this.createSnapshots(success)
            })
        })
    }
    
    createSnapshot(volume){
        return new Promise((resolve,reject) => {
            this.execute('createSnapshot', {response:"json", volumeid:volume.id}, (err, response) => {
                if (err){
                    reject(err);
                } 
                else{
                    console.log("Volume snapshoted:"+volume.id)
                    let id = volume.id
                    this.logs[this.customer.name].push({ 
                        volumeId: volume.id,
                        status: "success"
                     })
                    resolve()
                }
            });
        })
    }

    cleanSnapshotForVolume(volume){
        return new Promise((resolve,reject) => {
            this.execute('listSnapshots', {response:"json", volumeid:volume.id}, (err, response) => {
                    if(response != undefined){
                        response = response.listsnapshotsresponse
                        let volumeSnapshots = response.snapshot
                        if (response.count > this.keepSnapshots){                     
                            volumeSnapshots.sort((b,a) => {
                                return moment(a.created).diff(b.created)
                            })
                            let promises = []
                            let snapshotsToRemove = volumeSnapshots.slice(this.keepSnapshots)
                            snapshotsToRemove.forEach(function(snapshot) {
                                promises.push(this.removeSnapshot(snapshot))
                            }, this);
                            Promise.all(promises).then(() => {
                                resolve(snapshotsToRemove)
                            });
                        } else{
                            resolve()
                        }
                    } else {
                        //Sometimes response is null 
                        resolve()
                    }
            });
        })
    }
    
    removeSnapshot(snapshot){
        return new Promise((resolve,reject) => {
            this.execute('deleteSnapshot', {response:"json", id:snapshot.id}, (err, response) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        });
    }
    
    listVolumes(success){
        this.execute('listVolumes', {response:"json"}, (err, response) => {              
                response = response.listvolumesresponse;
                this.volumes = response.volume
                success()
        })
    }
    
    listSnapshots(success){
        this.execute('listSnapshots', {response:"json"}, (err, response) => {
            if(err){
                return this.handleError(err)
            }
            response = response.listsnapshotsresponse
            this.snapshots = response.snapshot
            success()
        });
    }
    createSnapshots(success){
        let promises = []
        this.volumes.forEach((volume) => {
            if( !this.exclude.includes(volume.vmdisplayname)) {
                promises.push(this.createSnapshot(volume));
            }
        }, this);

        Promise.all(promises).then(()=>{
            success()
        }).catch(err => { 
            this.handleError(err)
        });
    }
    
    cleanSnapShots(success){
        let promises = []
        this.volumes.forEach((volume) => {
            if( !this.exclude.includes(volume.vmdisplayname)) {
                promises.push(this.cleanSnapshotForVolume(volume))
            }
        }, this);
        Promise.all(promises).then( (snapshotsToRemove) => {
            snapshotsToRemove.forEach(element => {
                if(element != undefined){
                    this.logs[this.customer.name].push({
                        snapshotId : element[0].id,
                        status: "snapshot removed"
                    }
                    )
                }

            });
            success()
        }).catch(err => {
            this.handleError(err)
        });
    }
    
    handleError(err){
        if (err.name === 'APIError') {
            switch (err.code) {
            case 401:
                this.logs[customer.name] = {"error" : 'Unauthorized.'}; 
                return console.log('Unauthorized.');
            case 530:
                this.logs[customer.name] = {"error" : 'Parameter error: ' + err.message}; 
                return console.log('Parameter error: ' + err.message);
            default:
                this.logs[customer.name] = {"error" : 'API error ' + err.code + ': ' + err.message}; 
                return console.log('API error ' + err.code + ': ' + err.message);
            }
        } else {
            return console.log('Oops, I did it again. ' + err.message);
        }
    }

}


module.exports = ExoscaleSnapshotClient;