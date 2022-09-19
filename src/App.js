import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';
const qs = require('qs')
const web3 = require('web3')
const BigNumber = require('bignumber.js');


let currentSelectSide;
let currentTrade = {};
let tokens;

function App() {


  async function init() {
      await listAvailableTokens();
  }
  init();

  async function listAvailableTokens(){
      console.log("initializing");
      let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
      let tokenListJSON = await response.json();
      console.log("listing available tokens: ", tokenListJSON);
      tokens = tokenListJSON.tokens;
      console.log("tokens: ", tokens);

      let parent = document.getElementById("token_list");
      for (const i in tokens){
          // Token row in the modal token list
          let div = document.createElement("div");
          div.className = "token_row";
          let html = `
          <img class="token_list_img" src="${tokens[i].logoURI}">
          <span class="token_list_text">${tokens[i].symbol}</span>
            `;
          div.innerHTML = html;
          div.onclick = () => {
              selectToken(tokens[i]);
          };
          parent.appendChild(div);
      };
  }
 
  async function openModal(side){
   currentSelectSide = side;
   document.getElementById("token_modal").style.display= "block";
   
  }
  async function selectToken(token){
   closeModal(); 
   currentTrade[currentSelectSide] = token;    
   renderInterface();
   console.log("currentTrade: ",  currentTrade[currentSelectSide]);
    
}
 async function renderInterface(){
    if (currentTrade.from){
        console.log(currentTrade.from)
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }
   if(currentTrade.to){
        console.log(currentTrade.to)
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }
}
  async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
          
          await window.ethereum.request({ method: "eth_requestAccounts" });
            console.log("connecting");
           document.getElementById("login_button").innerHTML = "Connected";      
        } catch (error) {
            console.log(error);
        }
        document.getElementById("swap_button").disabled = false;
    } else {
        document.getElementById("login_button").innerHTML = "Please install MetaMask";
    }
}
function closeModal(){
  document.getElementById("token_modal").style.display = "none";
}

async function getPrice(){
 

  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

  const params = {
      sellToken: currentTrade.from.address,
      buyToken: currentTrade.to.address,
      sellAmount: amount,
  }
  
  // Fetch the swap price.

 // const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`);
const response = await fetch(`https://api.0x.org/swap/v1/price?sellToken=${currentTrade.from.address}&buyToken=${currentTrade.to.address}&sellAmount=${amount}`)
  console.log("Getting Price");
  const swapPriceJSON = await response.json();
  console.log("Price: ", swapPriceJSON);
  
  document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
}

async function getQuote(account){
  console.log("Getting Quote");

  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

  const params = {
    buyToken: currentTrade.to.address,
    sellToken: currentTrade.from.address,
    sellAmount: amount,
    takerAddress: account,
  }


  // Fetch the swap quote.
 // https://api.0x.org/swap/v1/quote?buyToken=DAI&sellToken=ETH&sellAmount=1000000000000000000&takerAddress=0xab5801a7d398351b8be11c439e05c5b3259aec9b
  const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
  
  const swapQuoteJSON = await response.json();
  console.log("Quote: ", swapQuoteJSON);
  
  document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.estimatedGas;

  return swapQuoteJSON;
}

async function trySwap(){
  const erc20abi= [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }]
  
  console.log("trying swap");

  // Only work if MetaMask is connect
  // Connecting to Ethereum: Metamask
  const web3 = new Web3(Web3.givenProvider);

  // The address, if any, of the most recently used account that the caller is permitted to access
  let accounts = await window.ethereum.request({ method: "eth_accounts" });
  let takerAddress = accounts[0];
  console.log("takerAddress: ", takerAddress);

  const swapQuoteJSON = await getQuote(takerAddress);

  // Set Token Allowance
  // Set up approval amount
     const fromTokenAddress = currentTrade.from.address;
     const maxApproval = new BigNumber(2).pow(256).minus(1);
     console.log("approval amount: ", maxApproval);
     const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
     console.log("setup ERC20TokenContract: ", ERC20TokenContract);

  // Grant the allowance target an allowance to spend our tokens.
        const tx = await ERC20TokenContract.methods.approve(
            swapQuoteJSON.allowanceTarget,
            maxApproval,
        )
        .send({ from: takerAddress })
        .then(tx => {
            console.log("tx: ", tx)
        });

  // Perform the swap
  const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
  console.log("receipt: ", receipt);
}



  return (
    <div className="App" >
     <nav className="navbar navbar-expand-lg navbar-light bg-dark d-flex justify-content-between">
        <h2  className="text-white mx-3">DEX Practice</h2>
        <ul className="navbar-nav ml-auto"/>
          <li className="nav-item">
            <button id='login_button' onClick={() => {connect()}} class="btn btn-outline-primary btn-lg m-3" type="submit">Connect Wallet</button>
          </li>
      </nav>
      <div className="container">
        <div className="row">
            <div className="col col-md-6 offset-md-3" id="window">
                <h2>Swap</h2>
                <div id="form" >

                    <div className="swapbox">                
                        <div className="swapbox_select token_select" id="from_token_select"  onClick={() => openModal('from') }  >
                            <img className="token_img " id="from_token_img"  />
                            <span id="from_token_text" className='h4' >from</span>
                        </div>
                        <div className="swapbox_select">
                            <input className="number form-control" placeholder="amount" id="from_amount" onBlur={() => getPrice()}/>
                        </div>
                    </div>

                    <div className="swapbox">      
                        <div className="swapbox_select token_select" id="to_token_select"  onClick={() => openModal('to') } >
                            <img className="token_img" id="to_token_img"/>
                            <span id="to_token_text" className='h4' >to</span>
                        </div>
                         <div className="swapbox_select">
                            <input class="number form-control" placeholder="amount" id="to_amount"/>
                        </div>
                    </div>  
                    <div className="gas_estimate_label">Estimated Gas: <span id="gas_estimate"></span></div>
                    <div className="d-grid">
                    <button  class="btn btn-primary btn-lg btn-block" id="swap_button" onClick={ () => trySwap()}>Swap</button> 
                    </div>
                                   
                </div>
            </div>
        </div>
    </div>
    <div id='token_modal' className="modal" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select a Token</h5>
            <button id="modal_close" type="button" className="close" data-dismiss="modal" aria-label="Close"   onClick={ () => {closeModal()} }>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div id="token_list"></div>
          </div>
        </div>
      </div>
    </div>

    </div>
  );
}

export default App;
