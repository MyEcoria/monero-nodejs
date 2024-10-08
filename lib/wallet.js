'use strict';
const request = require('request-promise');
const http = require('http');

class Wallet {
    constructor(hostname, port, user, pass) {
        this.hostname = hostname || '127.0.0.1';
        this.port = port || 18082;
        this.user = user || '';
        this.pass = pass || '';

        this._request('get_balance'); // This line is necessary in order to do the initial handshake between this wrapper and monero-wallet-rpc; without it, the first request to the wrapper fails (subsequent request succeed, though.)
    }
}

// general API wallet request
Wallet.prototype._request = function (method, params = '') {
    let options = {
        forever: true,
        json: {'jsonrpc': '2.0', 'id': '0', 'method': method},
        agent: new http.Agent({
            keepAlive: true,
            maxSockets: 1
        })
    };

    if (params) {
        options['json']['params'] = params;
    }
    if (this.user) {
        options['auth'] = {
            'user': this.user,
            'pass': this.pass,
            'sendImmediately': false
        }
    }
    return request.post(`http://${this.hostname}:${this.port}/json_rpc`, options)
        .then((result) => {
            if (result.hasOwnProperty('result')) {
                return result.result;
            } else {
                return result;
            }
        });
};

/**
 * Wallet Methods
 * @type {Wallet}
 */

// creates a new wallet
Wallet.prototype.create_wallet = function(filename, password, language) {
    let method = 'create_wallet';
    let params = {
        filename: filename || 'monero_wallet',
        'password': password || '',
        'language': language || 'English'
    };
    return this._request(method, params);
};

// open a wallet
Wallet.prototype.open_wallet = function(filename, password) {
    let method = 'open_wallet';
    let params = {
        filename: filename || 'monero_wallet',
        'password': password || ''
    };
    return this._request(method, params);
};

// stops the wallet
Wallet.prototype.stop_wallet = function() {
    let method = 'stop_wallet';
    return this._request(method);
};

// returns the wallet balance
Wallet.prototype.balance = function(account_index, address_indices) {
    let method = 'get_balance';
    let params = {};
    params.account_index = account_index;
    params.address_indices = address_indices;
    return this._request(method, params);
};

// return the wallet address
Wallet.prototype.address = function() {
    let method = 'get_address';
    return this._request(method);
};

// return the wallet accounts
Wallet.prototype.accounts = function() {
    let method = 'get_accounts';
    return this._request(method);
};

// return the wallet accounts
Wallet.prototype.create_account = function() {
    let method = 'create_account';
    return this._request(method);
};

// transfer Monero to a single recipient, or a group of recipients
Wallet.prototype.transfer = function(destinations, options) {
    if(typeof options === 'undefined') options = {};
    if(Array.isArray(destinations)) {
        destinations.forEach((dest) => dest.amount = convert(dest.amount));
    } else {
        destinations.amount = convert(destinations.amount);
        destinations = [destinations];
    }
    let method = 'transfer';
    let params = {
        account_index: options.account_index || 0,
        subaddr_indices: options.subaddr_indices || 0,
        destinations: destinations,
        mixin: parseInt(options.mixin) || 4,
        unlock_time: parseInt(options.unlockTime) || 0,
        payment_id: options.pid || null,
        do_not_relay: options.do_not_relay || false,
        priority: parseInt(options.priority) || 0,
        get_tx_hex: options.get_tx_hex || false,
        get_tx_key: options.get_tx_key || false
    };
    return this._request(method, params);
};

// split a transfer into more than one tx if necessary
Wallet.prototype.transferSplit = function(destinations, options) {
    if(typeof options === 'undefined') options = {};
    if(Array.isArray(destinations)) {
        destinations.forEach((dest) => dest.amount = convert(dest.amount));
    } else {
        destinations.amount = convert(destinations.amount);
        destinations = [destinations];
    }
    let method = 'transfer_split';
    let params = {
        destinations: destinations,
        mixin: parseInt(options.mixin) || 4,
        unlock_time: parseInt(options.unlockTime) || 0,
        payment_id: options.pid || null,
        do_not_relay: options.do_not_relay || false,
        priority: parseInt(options.priority) || 0,
        get_tx_hex: options.get_tx_hex || false,
        get_tx_key: options.get_tx_key || false,
        new_algorithm: options.new_algorithm || false
    };
    return this._request(method, params);
};

// send all dust outputs back to the wallet with 0 mixin
Wallet.prototype.sweep_dust = function() {
    let method = 'sweep_dust';
    return this._request(method);
};

// send all dust outputs back to the wallet with 0 mixin
Wallet.prototype.sweep_all = function(address, account_index, subaddr_indices) {
    let method = 'sweep_all';
    let params = {};
    params.address = address;
    params.account_index = account_index;
    params.subaddr_indices = subaddr_indices;
    return this._request(method, params);
};

// send all dust outputs back to the wallet with 0 mixin
Wallet.prototype.create_address = function(account_index, label, count) {
    let method = 'create_address';
    let params = {};
    params.account_index = account_index;
    params.label = label;
    params.count = count;
    return this._request(method, params);
};

Wallet.prototype.get_address = function(account_index) {
    let method = 'get_address';
    let params = {};
    params.account_index = account_index;
    return this._request(method, params);
};

// get a list of incoming payments using a given payment ID
Wallet.prototype.getPayments = function(pid) {
    let method = 'get_payments';
    let params = {};
    params.payment_id = pid;
    return this._request(method, params);
};

// get a list of incoming payments using a single payment ID or list of payment IDs from a given height
Wallet.prototype.getBulkPayments = function(pids, minHeight) {
    let method = 'get_bulk_payments';
    let params = {};
    params.payment_ids = pids;
    params.min_block_height = minHeight;
    return this._request(method, params);
};

// return a list of incoming transfers to the wallet (type can be "all", "available", or "unavailable")
Wallet.prototype.incomingTransfers = function(type) {
    let method = 'incoming_transfers';
    let params = {};
    params.transfer_type = type;
    return this._request(method, params);
};

// return the spend key or view private key (type can be 'mnemonic' seed or 'view_key')
Wallet.prototype.queryKey = function(type) {
    let method = 'query_key';
    let params = {};
    params.key_type = type;
    return this._request(method, params);
};

// make an integrated address from the wallet address and a payment id
Wallet.prototype.integratedAddress = function(pid) {
    let method = 'make_integrated_address';
    let params = {};
    params.payment_id = pid;
    return this._request(method, params);
};

// retrieve the standard address and payment id from an integrated address
Wallet.prototype.splitIntegrated = function(address) {
    let method = 'split_integrated_address';
    let params = {};
    params.integrated_address = address;
    return this._request(method, params);
};

// return the current block height
Wallet.prototype.height = function() {
    let method = 'getheight';
    return this._request(method);
};

// stop the current simplewallet process
Wallet.prototype.stopWallet = function() {
    let method = 'stop_wallet';
    return this._request(method);
};

module.exports = Wallet;

// helper function to convert Monero amount to atomic units
function convert(amount) {
    let number = Number(amount) * 1e12;
    // remove any decimals
    number = number.toFixed(0);
    return Number(number);
}
