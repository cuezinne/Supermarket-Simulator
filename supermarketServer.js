const http = require("http");
const express = require("express")
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const portNumber = 5000;
const httpSuccessStatus = 200;

class HtmlTable {
    #table;
    constructor(data){
        let tableBody = '';
        data.forEach(element => {
            tableBody += `<tr><td>${element["name"]}</td><td>${element["cost"].toFixed(2)}</td></tr>`;
        });
        this.#table = '<table border="1"><tr><th>Item</th><th>Cost</th></tr>'+ tableBody + '</table>';
    }
    getTable(){
        return this.#table;
    }
}

process.stdin.setEncoding("utf8");

const fileName = process.argv[2];
let data = null;
fs.readFile(fileName, 'utf-8',
                function (err, fileContent){
                    if (err) {
                        throw err;
                    }
                    data = JSON.parse(fileContent)["itemsList"];
                });

if (process.argv.length != 3){
    process.stdout.write(`Usage ${process.argv[1]} jsonFile`);
    process.exit(1);
}

console.log(`Web server is running at http://localhost:${portNumber}`);
process.stdout.write(`Type itemsList or stop to shutdown the server: `)

process.stdin.on('readable', () => {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop"){
            console.log("Shutting down the server");
            process.exit(0);
        } else if(command === "itemsList"){
            console.log(data);

        } else {
            console.log(`Invalid command: ${command}`);

        }

        process.stdout.write(`Type itemsList or stop to shutdown the server: `)
        process.stdin.resume();
    }
});

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/catalog", (request, response) => {
    const table = new HtmlTable(data);
    response.render("displayItems", {itemsTable: table.getTable()});
});

app.get("/order", (request, response) => {
    let options = '';
    data.forEach(element => {
        options += `<option value="${element["name"]}">${element["name"]}</option>`;
    })
    response.render("placeOrder", {items:options});
});

app.use(bodyParser.urlencoded({extended:false}));

app.post("/order", (request, response) => {
    let tableBody = '';
    let total = 0;
    data.forEach(element => {
        if(request.body.itemsSelected.includes(element["name"])){
            tableBody += `<tr><td>${element["name"]}</td><td>${element["cost"].toFixed(2)}</td></tr>`;
            total += element["cost"];
        }
    })
    const table = `<table border="1"><tr><th>Item</th><th>Cost</th></tr>${tableBody}<tr><td>Total Cost:</td><td>${total}</td></tr></table>`;
    const variables = {
        name: request.body.name,
        email: request.body.email,
        delivery: request.body.delivery,
        orderTable: table
    }
    response.render("orderConfirmation", variables);
});

app.listen(portNumber, (err)=> {
    if(err){
        console.log("Starting server failed.");
    }
});