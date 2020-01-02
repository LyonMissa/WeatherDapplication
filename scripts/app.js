// Aeternity requirements

const contractSource = `
//  uses sophia compiler greater than or equal to 4.0.0
@compiler >= 4.0.0

payable contract Weather = 
    // type string = s
    // type int = i
    // type address = a
    
    


    // Emits an avent
    datatype event =
      FirstEvent(int, string)

    record user = {
        id : int,
        callerAddress : address,
        owner : string,
        numberOfSearches : int}

    record state = {
        users : map(int,user),
        total : int,
        ownerAddress : address}





    entrypoint init() ={users = {}, total =0, ownerAddress= Call.caller }

    payable stateful entrypoint getWeather() = 
        // Requires that the user has enough AE to call the function

        require(Chain.balance(Call.caller) > 1000000, "You dont have enough ae")

        // owner is the address that deployed the contract
        let owner  = state.ownerAddress

        Chain.spend(owner,1000000)

    entrypoint getTotalTx() =
        state.total

    entrypoint getUser(index) =
        state.users[index] 

    entrypoint getOwnerAddress() =
        state.ownerAddress


    

    stateful entrypoint addUser(mail : string) =
    

        let newUser = {
            callerAddress = Call.caller,
            id = getTotalTx()+1, 
            owner = mail,

            numberOfSearches = 0}


        let index = getTotalTx() + 1
        put(state{users[index] = newUser, total = index})

        Chain.event(FirstEvent(index, mail))

`;

const contractAddress = "ct_8mEmWCAsM2QFSBMJ8DQJcuRXCoPYnRrsJ9cXDhNJ6NXFwWcLm";
var client = null;
UserArray = [];

async function callStatic(func, args) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract
    .call(func, args, {
      callStatic: true
    })
    .catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract
    .call(func, args, {
      amount: value
    })
    .catch(e => console.error(e));

  return calledSet;
}

// render users to the log div

function renderUsers() {
  let template = $("#template").html();

  Mustache.parse(template);

  var rendered = Mustache.render(template, { UserArray });

  $("#logs").html(rendered);

  console.log("logs rendered");
}

// Targets
const cityForm = document.querySelector("form");
const card = document.querySelector(".card");
const details = document.querySelector(".details");
const time = document.querySelector("img.time");
const icon = document.querySelector(".icon img");

const updateUI = data => {
  // destructure properties
  const { cityDets, weather } = data;

  // update details template
  details.innerHTML = `
    <h5 class="my-3">${cityDets.EnglishName}</h5>
    <div class="my-3">${weather.WeatherText}</div>
    <div class="display-4 my-4">
      <span>${weather.Temperature.Metric.Value}</span>
      <span>&deg;C</span>
    </div>
  `;

  // update the night/day & icon images
  const iconSrc = `img/icons/${weather.WeatherIcon}.svg`;
  icon.setAttribute("src", iconSrc);

  const timeSrc = weather.IsDayTime ? "img/day.svg" : "img/night.svg";
  time.setAttribute("src", timeSrc);

  // remove the d-none class if present
  if (card.classList.contains("d-none")) {
    card.classList.remove("d-none");
  }
};

const updateCity = async city => {
  $(".loading").fadeIn();
  const cityDets = await getCity(city);
  const weather = await getWeather(cityDets.Key);
  $(".loading").fadeOut();
  return { cityDets, weather };
};

window.addEventListener("load", async () => {
  $(".loading").fadeIn();
  $("#logs").hide();
  $("#getWeather").hide();
  $("#signUp").fadeIn();

  // initialize client
  
  client = await Ae.Aepp();

  length = await callStatic("getTotalTx", []);
  console.log(length);

  // Get list of people that have used the dapp

  console.log("Printing to console");

  for (let i = 1; i <= length; i++) {
    $(".loading").fadeIn();
    user = await callStatic("getUser", [i]);

    UserArray.push({
      userAddress: user.callerAddress,
      owner: user.owner,
      numberOfSearches: user.numberOfSearches,
      id: user.id
    });
    console.log("rendered")
  }

  console.log("rendered fine")

  renderUsers();
  $("#logs").fadeIn();
  $(".loading").fadeOut();

  // hide and show necessary divs

  // console.log("THis is printing out client", client);
  // userAddress = client.address;
  // console.log("Users Address", userAddress);

});

// Click of the register button

$(".submitReg").click(async e => {
  e.preventDefault();
  $("#logs").fadeOut();
  $(".loading").fadeIn();
  mail = $("#emailReg").val();
  console.log(mail);
  newUser = await contractCall("addUser", [mail], 0);

  $("#getWeather").fadeIn();
  $("#signUp").fadeOut();
  $(".loading").fadeOut();
});

cityForm.addEventListener("submit", async e => {
  // prevent default action
  $(".loading").fadeIn();
  e.preventDefault();

  await contractCall("getWeather", [], 1000000).catch(e => console.error(e));

  // get city value
  const city = cityForm.city.value.trim();
  cityForm.reset();

  console.log(" this is city", city);

  // update the ui with new city
  updateCity(city)
    .then(data => updateUI(data))
    .catch(err => console.log(err));

  // set local storage
  localStorage.setItem("city", city);
  $(".loading").fadeOut();
});

if (localStorage.getItem("city")) {
  $(".loading").fadeIn();
  updateCity(localStorage.getItem("city"))
    .then(data => updateUI(data))
    .catch(err => console.log(err));
  $(".loading").fadeOut();
}
