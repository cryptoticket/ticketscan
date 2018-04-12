var express = require('express');
var Web3 = require('web3');
const pug = require('pug');

var models = require('./models.js');
var scanner = require('./scanner.js');
var settings = require('./settings.json');
var ipfsData = require('./ipfs-data.js');

const app = express(),

mongoURL = process.env.MONGO_URL || 'mongo:27017/crypto_scanner',
mongoose = require('mongoose'),
mongo = mongoose.connect(`mongodb://${mongoURL}`),

nodeURL = process.env.NODE_URL || settings.node_url,
web3 = new Web3(new Web3.providers.HttpProvider(nodeURL));


app.set('settings', settings);
app.set('web3', web3);
app.set('view engine', 'pug');
app.set('mongo', mongo);

app.use(express.static('public'));
app.use('/static', express.static(__dirname + '/public'));

app.locals.moment = require('moment');


app.get('/', async (req, res, next) => {
    try {
        res.render("index", {
            "data": await getDataItems(),
            "moment": require('moment'),
            'total_organizers': await getTotalOrganizers(),
            'tickets_released': await getTicketsAllocated(),
            'total_events': await getEvents(),
            'tickets_redeemend': await getSmartTicketsRedeemed(),
            'tickets_wallets': await getWallets(),
            'tickets_value': await getTicketValue(),
            'chart_times': await getChartTimes(),
            'chart_data_events': await getChartDataEvents(),
            'chart_data_tickets': await getChartDataTickets(),
        });
    } catch (e) {
      //this will eventually be handled by your error handling middleware
      next(e)
    }
})



async function getDataItems() {
    const moment = require('moment');
    let data = []
    let contracts = await models.Contract.find().sort({created_at: -1}).limit(5);
    let transactions = await models.Transaction.find().sort({created_at: -1}).limit(5);

    for (let contract of contracts) {
        data.push({
            type: "New event published",
            address: contract.address,
            timedelta: new Date(contract.created_at.getTime()).toString()
        });
    }

    for (let transaction of transactions) {
        if (transaction.event == 'TicketAllocated') {
            data.push({
                type: "Smart Tickets Released",
                address: transaction.address,
                timedelta: new Date(transaction.created_at.getTime()).toString()
            });
        } else if (transaction.event == 'TicketRedeemed'){
            data.push({
                type: "Smart Tickets Redeemed",
                address: transaction.address,
                timedelta: new Date(transaction.created_at.getTime()).toString()
            });
        } else if (transaction.event == 'TicketTransferred') {
            data.push({
                type: "Smart Tickets Transferred",
                address: transaction.address,
                timedelta: new Date(transaction.created_at.getTime()).toString()
            });
        } else {
            // console.log()
        }
    }
    return data.sort(function(a, b){return a.created_at > b.created_at})
}

async function getTicketsAllocated() {
    let tickets = await models.Transaction.count({
        event: 'TicketAllocated'
    });
    return tickets
}

async function getSmartTicketsRedeemed() {
    let tickets = await models.Transaction.count({
        event: 'TicketRedeemed'
    });
    return tickets
}

async function getEvents() {
    let events = await models.Contract.count({
        is_active: true
    });
    return events
}

async function getTotalOrganizers() {
    let partners = []
    let events = await models.Contract.find({
        is_active: true
    });

    for (let event of events) {
        partners.push(event.ipfs.organizer.id);
    }
    unique_partners = new Set(partners)
    return unique_partners.size
}

async function getWallets() {
    let wallets = []
    let tickets = await models.Transaction.find({
        event: 'TicketAllocated'
    });

    for (let ticket of tickets) {
        // const transaction = await web3.eth.getTransaction(ticket.address)
        if (typeof(ticket.customer_wallet) == 'string') {
            wallets.push(ticket.customer_wallet);
        } else {

        }

    }
    unique_wallets = new Set(wallets)
    return unique_wallets.size
}

async function getTicketValue() {
    let values = []
    let tickets = await models.Transaction.find({
        event: 'TicketAllocated'
    });

    for (let ticket of tickets) {
        values.push(parseInt(ticket.ipfs.price.nominal));
    }

    if (values.length == 0) {
        return 0
    } else {
        let d = values.reduce(function(a, b){return a+b;})
        let value = d / parseFloat('56.65')

    return Number((value).toFixed(1))

    }

}


async function getChartDataEvents() {
    let data = []
    dates = await _getTimes()
    for (let date of dates) {
        let events = await models.Contract.count({
            is_active: true,
            created_at: {
                $gte: new Date(date).toISOString(),
                $lte:  new Date(date+86400*1000).toISOString()
            }
        });
        data.push(events);
    }
    return data

}

async function getChartDataTickets() {
    let data = []
    dates = await _getTimes()
    for (let date of dates) {
        let tickets = await models.Transaction.count({
            'event': 'TicketAllocated',
            created_at: {
                $gte: new Date(date).toISOString(),
                $lte:  new Date(date+86400*1000).toISOString()
            }
        });
        data.push(tickets);
    }
    return data

}

async function _getTimes() {
    const moment = require('moment');

    let dates = []
    let date = moment();

    let day1 = 86400 * 1000
    let day2 = 2 * day1
    let day3 = 3 * day1
    let day4 = 4 * day1
    let day5 = 5 * day1

    dates.push(date.utc().valueOf());
    dates.push(date.utc().valueOf() - day1);
    dates.push(date.utc().valueOf() - day2);
    dates.push(date.utc().valueOf() - day3);
    dates.push(date.utc().valueOf() - day4);

    return dates.reverse()
}

function formatDate(date) {
    var dd = date.getDate();
    if (dd < 10) dd = '0' + dd;

    var mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;

    var yy = date.getFullYear() % 100;
    if (yy < 10) yy = '0' + yy;

    return dd + mm + yy;
  }


async function getChartTimes() {
    const moment = require('moment');

    let dates = []
    let date = moment();

    let day1 = 86400 * 1000
    let day2 = 2 * day1
    let day3 = 3 * day1
    let day4 = 4 * day1
    let day5 = 5 * day1

    dates.push(formatDate(new Date(date.utc().valueOf())));
    dates.push(formatDate(new Date(date.utc().valueOf() - day1)));
    dates.push(formatDate(new Date(date.utc().valueOf() - day2)));
    dates.push(formatDate(new Date(date.utc().valueOf() - day3)));
    dates.push(formatDate(new Date(date.utc().valueOf() - day4)));

    return dates.reverse()
}
// app.get('/transactions/:id', async (req, res, next) => {
//     try {
//         let transactions = await models.Transaction.find();
//         res.render("transactions", {
//             "transactions": transactions,
//             "moment": require('moment')
//         });
//     } catch (e) {
//       //this will eventually be handled by your error handling middleware
//       next(e)
//     }
// })


app.get('/contracts/:id', async (req, res, next) => {
    try {
        let transactions = await models.Transaction.find({
            contract: req.params.id
        });
        // console.log(transactions[6])
        res.render("transactions", {
            "transactions": transactions,
            "moment": require('moment')
        });
    } catch (e) {
      //this will eventually be handled by your error handling middleware
      next(e)
    }
})



app.listen(3000, function () {
    console.log('Example app listening on port 3000!');

});
