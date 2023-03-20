// =============================================================================
//                                  Config
// =============================================================================

let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

// Constant we use later
var GENESIS = '0x0000000000000000000000000000000000000000000000000000000000000000';

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"internalType": "uint32",
				"name": "amount",
				"type": "uint32"
			},
			{
				"internalType": "address[]",
				"name": "path",
				"type": "address[]"
			},
			{
				"internalType": "uint256",
				"name": "minAmount",
				"type": "uint256"
			}
		],
		"name": "add_IOU",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			}
		],
		"name": "getCreditors",
		"outputs": [
			{
				"internalType": "address[10]",
				"name": "",
				"type": "address[10]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "gettotalowed",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "tIOU",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			}
		],
		"name": "lookup",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "tIOU",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "transactionRecords",
		"outputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]; // FIXME: fill this in with your contract's ABI //Be sure to only have one array, not two

// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

var contractAddress = '0xd6A3A006be3315c11424e67E192a464E9fe4F345'; // FIXME: fill this in with your contract's address/hash
var BlockchainSplitwise = new web3.eth.Contract(abi, contractAddress);


// =============================================================================
//                            Functions To Implement
// =============================================================================

// TODO: Add any helper functions here!
async function getIOUNeighbors(currentNode) {

	let curentCreditorsofNode = await BlockchainSplitwise.methods.getCreditors(currentNode).call()

	console.log("curent Creditors of Node - Neighbor " + curentCreditorsofNode)
	var filtered = curentCreditorsofNode.filter(function (value, index, arr) {
		return value !== '0x0000000000000000000000000000000000000000';
	});
	console.log(currentNode + " has curent Creditors of Node - Neighbor " + filtered)
	return filtered;
}

// TODO: Return a list of all users (creditors or debtors) in the system
// You can return either:
//   - a list of everyone who has ever sent or received an IOU
// OR
//   - a list of everyone currently owing or being owed money
async function getUsers() {


	let userList = [];
	var funcs = await getAllFunctionCalls(contractAddress, "add_IOU");
	for (i = 0; i < funcs.length; i++) {
		let k = funcs[i].args[2].length - 1;
		if (userList.indexOf(funcs[i].args[0]) < 0) userList.push(funcs[i].args[0]);
		if (userList.indexOf(funcs[i].args[2][k]) < 0) userList.push(funcs[i].args[2][k]);
	}

	return userList;/**/

}

// TODO: Get the total amount owed by the user specified by 'user'
async function getTotalOwed(user) {

	let totalOwed = await BlockchainSplitwise.methods.gettotalowed(user).call()

	return Number(totalOwed);
	/**/

}

// TODO: Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity for the user.
// HINT: Try looking at the way 'getAllFunctionCalls' is written. You can modify it if you'd like.
async function getLastActive(user) {


	var funcs = await getAllFunctionCalls(contractAddress, "add_IOU");
	for (i = 0; i < funcs.length; i++) {

		let k = funcs[i].args[2].length - 1;
		if (funcs[i].args[0] == user.toLowerCase() || funcs[i].args[2][k] == user.toLowerCase()) return funcs[i].t;

	}

	/*	*/
}

// TODO: add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'

async function add_IOU(creditor, amount) {

	let debtor = web3.eth.defaultAccount.toLowerCase();

	let allAccounts = await web3.eth.getAccounts();
	let loopPath = [debtor];


	let minAmount = amount;
	var curPath = await doBFS(creditor, debtor, getIOUNeighbors);

	if (curPath !== null) {

		console.log("loop path is");
		loopPath = curPath;
		console.log(curPath);

		for (i = 0; i < loopPath.length - 1; i++) {

			temp = await BlockchainSplitwise.methods.lookup(loopPath[i], loopPath[i + 1]).call();
			minAmount = Math.min(minAmount, Number(temp));
			if (minAmount === 0) { loopPath = [debtor]; minAmount = amount; break; }

		}
	}
	else
		console.log("path is empty");

	await BlockchainSplitwise.methods.add_IOU(creditor, amount, loopPath, minAmount).send({ from: web3.eth.defaultAccount, gas: 1000000 })
}


//

async function add_IOU_Unit(creditor, amount, debtor) {
	let loopPath = [debtor.toLowerCase()];
	let minAmount = amount;
	var curPath = await doBFS(creditor, debtor, getIOUNeighbors);
	if (curPath !== null) {
		console.log("loop path is");
		loopPath = curPath;
		console.log(curPath);

		for (i = 0; i < loopPath.length - 1; i++) {

			temp = await BlockchainSplitwise.methods.lookup(loopPath[i], loopPath[i + 1]).call();
			minAmount = Math.min(minAmount, Number(temp));
			if (minAmount === 0) { loopPath = [debtor]; minAmount = amount; break; }

		}
	}
	else
		console.log("path is empty");

	console.log("end of add_IOU");

	console.log("in Add IOU check credit then debtor")
	console.log("Debtor is: " + loopPath);
	console.log("creditor is:" + creditor);


	await BlockchainSplitwise.methods.add_IOU(creditor, amount, loopPath, minAmount).send({ from: web3.eth.defaultAccount, gas: 1000000 })
}




// =============================================================================
//                              Provided Functions
// =============================================================================
// Reading and understanding these should help you implement the above

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string) contract
// It returns an array of objects, one for each call, containing the sender ('from'), arguments ('args'), and the timestamp ('t')
async function getAllFunctionCalls(addressOfContract, functionName) {
	var curBlock = await web3.eth.getBlockNumber();

	//console.log(curBlock);

	var function_calls = [];

	while (curBlock !== GENESIS) {
		var b = await web3.eth.getBlock(curBlock, true);
		var txns = b.transactions;



		for (var j = 0; j < txns.length; j++) {
			var txn = txns[j];

			// check that destination of txn is our contract
			if (txn.to == null) { continue; }
			if (txn.to.toLowerCase() === addressOfContract.toLowerCase()) {
				var func_call = abiDecoder.decodeMethod(txn.input);

				// check that the function getting called in this txn is 'functionName'
				if (func_call && func_call.name === functionName) {
					var time = await web3.eth.getBlock(curBlock);

					var args = func_call.params.map(function (x) { return x.value });
					function_calls.push({
						from: txn.from.toLowerCase(),
						args: args,
						t: time.timestamp
					})

				}



			}
		}



		curBlock = b.parentHash;
	}


	return function_calls;
}

// We've provided a breadth-first search implementation for you, if that's useful
// It will find a path from start to end (or return null if none exists)
// You just need to pass in a function ('getNeighbors') that takes a node (string) and returns its neighbors (as an array)
async function doBFS(start, end, getNeighbors) {

	console.log("doBFS start:" + start);
	console.log("doBFS end:" + end);


	var queue = [[start]];
	//console.log(queue[0])
	while (queue.length > 0) {
		var cur = queue.shift();
		console.log("doBFS cur:" + cur);
		console.log("doBFS queue.length:" + queue.length);

		var lastNode = cur[cur.length - 1]

		console.log("doBFS lastnode:" + lastNode);

		if (lastNode === end) {
			console.log("Arrive at End");
			//alert("doBFS end ndoe is found")
			return cur;
		} else {
			var neighbors = await getNeighbors(lastNode);

			console.log("neighbor:" + neighbors)
			//alert("neighbor:" + neighbors)

			for (var i = 0; i < neighbors.length; i++) {
				console.log(" doBFS neighbor:" + neighbors[i])
				queue.push(cur.concat([neighbors[i]]));
			}
		}
	}

	//alert("in doBFS")
	return null;
}

// Unit Test


let amounts = [14, 6, 15, 11, 13, 15, 22, 16];

//let amounts = [14, 6];
let accounts =[];

$("#runUTest").click(function () {
	//web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
	add_Unit_Test_Action();
});


async function add_Unit_Test_Action() {
	let allAccounts = await web3.eth.getAccounts();
	// apply call IOU on 9 account of them;

	let _size = Math.min(amounts.length, allAccounts.length - 2);
	let i;
	for (i = 0; i < _size - 1; i++) {
		await add_IOU_Unit(allAccounts[i + 1], amounts[i], allAccounts[i]);
	}


	await add_IOU_Unit(allAccounts[i], amounts[i], allAccounts[0]);  // link last one to the first one to make a loop

}

$("#chkUTest").click(function () {
	//web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
	show_UnitTest().then((response) => {
		$(".unit_test_result").html(response.map(function (a) { return '<li>' + a[0].toLowerCase() + '--[' + a[2].toString() + ']--' + a[1].toLowerCase() + '</li>' }));
	})

});



async function show_UnitTest() {

	let allAccounts = await web3.eth.getAccounts();
	let testResult = [];
	//let allAccounts = await web3.eth.getAccounts();

	let debtors=  [4,0,9,8,3,6,5,2];
	let creditors=[0,9,8,3,6,5,2,4]
	let amounts = [14, 6, 15, 11, 13, 15, 22, 16];
	let i;
	for (i = 0; i < debtors.length; i++) {

		temp = await BlockchainSplitwise.methods.lookup(allAccounts[debtors[i]], allAccounts[creditors[i]]).call();
		//temp = 100;
		let oneresult = [allAccounts[debtors[i]], allAccounts[creditors[i]], temp];
		console.log(oneresult);
		testResult.push(oneresult);
	}


	//alert(allAccounts.length)
	return testResult;

}



///

// =============================================================================
//                                      UI
// =============================================================================

// This sets the default account on load and displays the total owed to that
// account.
web3.eth.getAccounts().then((response) => {
	web3.eth.defaultAccount = response[0];

	getTotalOwed(web3.eth.defaultAccount).then((response) => {
		$("#total_owed").html("$" + response);
	});

	getLastActive(web3.eth.defaultAccount).then((response) => {
		time = timeConverter(response)
		$("#last_active").html(time)
	});
});

// This code updates the 'My Account' UI with the results of your functions
$("#myaccount").change(function () {
	web3.eth.defaultAccount = $(this).val();

	getTotalOwed(web3.eth.defaultAccount).then((response) => {
		$("#total_owed").html("$" + response);
	})

	getLastActive(web3.eth.defaultAccount).then((response) => {
		time = timeConverter(response)
		$("#last_active").html(time)
	});
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
web3.eth.getAccounts().then((response) => {
	var opts = response.map(function (a) { accounts.push(a);
		return '<option value="' +
			a.toLowerCase() + '">' + a.toLowerCase() + '</option>'
	});
	$(".account").html(opts);
	$(".wallet_addresses").html(response.map(function (a) { return '<li>' + a.toLowerCase() + '</li>' }));
});

// This code updates the 'Users' list in the UI with the results of your function
getUsers().then((response) => {
	$("#all_users").html(response.map(function (u, i) { return "<li>" + u + "</li>" }));
});

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function () {
	/*web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
	add_IOU($("#creditor").val(), $("#amount").val()).then((response) => {
		window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
	})
*/
let counter = Number($("#amount").val());
let debtors=  [4,0,9,8,3,6,5,2];
let creditors=[0,9,8,3,6,5,2,4]
let amounts = [14, 6, 15, 11, 13, 15, 22, 16];

		add_IOU_Unit(accounts[creditors[counter]], amounts[counter], accounts[debtors[counter]]).then((response) => {
			window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
		});	

});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
	$("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "\n\n");
}


// =============================================================================
//                                      TESTING
// =============================================================================

// This section contains a sanity check test that you can use to ensure your code
// works. We will be testing your code this way, so make sure you at least pass
// the given test. You are encouraged to write more tests!

// Remember: the tests will assume that each of the four client functions are
// async functions and thus will return a promise. Make sure you understand what this means.

function check(name, condition) {
	if (condition) {
		console.log(name + ": SUCCESS");
		return 3;
	} else {
		console.log(name + ": FAILED");
		return 0;
	}
}

async function sanityCheck() {
	console.log("\nTEST", "Simplest possible test: only runs one add_IOU; uses all client functions: lookup, getTotalOwed, getUsers, getLastActive");

	var score = 0;

	var accounts = await web3.eth.getAccounts();
	web3.eth.defaultAccount = accounts[0];

	var users = await getUsers();
	score += check("getUsers() initially empty", users.length === 0);

	var owed = await getTotalOwed(accounts[0]);
	score += check("getTotalOwed(0) initially empty", owed === 0);
	var lookup_0_1 = await BlockchainSplitwise.methods.lookup(accounts[0], accounts[1]).call({ from: web3.eth.defaultAccount });
	score += check("lookup(0,1) initially 0", parseInt(lookup_0_1, 10) === 0);

	var response = await add_IOU(accounts[1], "10");

	users = await getUsers();
	score += check("getUsers() now length 2", users.length === 2);

	owed = await getTotalOwed(accounts[0]);
	score += check("getTotalOwed(0) now 10", owed === 10);

	lookup_0_1 = await BlockchainSplitwise.methods.lookup(accounts[0], accounts[1]).call({ from: web3.eth.defaultAccount });
	score += check("lookup(0,1) now 10", parseInt(lookup_0_1, 10) === 10);

	var timeLastActive = await getLastActive(accounts[0]);
	var timeNow = Date.now() / 1000;
	var difference = timeNow - timeLastActive;
	score += check("getLastActive(0) works", difference <= 60 && difference >= -3); // -3 to 60 seconds

	console.log("Final Score: " + score + "/21");
}

//sanityCheck() //Uncomment this line to run the sanity check when you first open index.html
