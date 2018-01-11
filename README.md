[![N|Solid](https://avatars2.githubusercontent.com/u/6224717?s=200&v=4)](https://apptitude.ch)

# Snapshot exoscale
This backup tool is used to make a rotative snapshot on exoscale servers for all our clients
# Prerequis
- node 8.9.4
- forever (for deamon mode)
# Installation
```sh
npm install
```
Create config.json file (based on config_demo.json) with the good API keys
# Run (production)
```sh
forever start index.js
```
# Run (dev)
```sh
node index.js
```

# Features!
  - Snapshot all machines for clients in config.json with 5 snapshots history


Made with 🖤 by apptitude
