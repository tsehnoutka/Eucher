const DEALER = document.getElementById('dealer');
const SUIT = document.getElementById('suit');
const SOUTH_NAME = document.getElementById('southName');
const WEST_NAME = document.getElementById('westName');
const NORTH_NAME = document.getElementById('northName');
const EAST_NAME = document.getElementById('eastName');
const NAMES = [SOUTH_NAME, WEST_NAME, NORTH_NAME, EAST_NAME]
const BTN_DEAL = document.getElementById('deal');
const DLG_TRUMP = document.getElementById('suit');
const BTN_TEST = document.getElementById('test');
const MODALORDER = document.getElementById("orderTrump"); // Get the modal
const MODALORDER_TXT = document.getElementById("modalOrderText");
const MODALDEALT = document.getElementById("dealtTrump"); // Get the modal
const MODALDEALT_TXT = document.getElementById("modalDealtText");
const SPAN = document.getElementsByClassName("close")[0]; // Get the <span> element that closes the modal
const BTN_MO_HEARTS = document.getElementById('modalOrderHearts');
const BTN_MO_SPADES = document.getElementById('modalOrderSpades');
const BTN_MO_DIAMONDS = document.getElementById('modalOrderDiamonds');
const BTN_MO_CLUBS = document.getElementById('modalOrderClubs');
const BTN_MO_PASS = document.getElementById('modalOrderPass');
const BTN_MD_PASS = document.getElementById('modalDealtPass');
const BTN_MD_TRUMP = document.getElementById('modalDealtTrump');

const suitConvertor = new Map();
suitConvertor.set("h", "Hearts");
suitConvertor.set("c", "Clubs");
suitConvertor.set("d", "Diamonds");
suitConvertor.set("s", "Spades");

const PLAYER_ONE = 0;
const PLAYER_TWO = 1;
const PLAYER_THREE = 2;
const PLAYER_FOUR = 3;
const MAX_PLAYERS = 4;

const GT_UTTT = 0;
const GT_REVERSI = 1;
const GT_PAGADE = 2;
const GT_EUCHRE = 3;
const GAME_TYPE = GT_EUCHRE;

var playedSuit = "h";
var myPlayerNumber = -1;
var turn = 0;
var numOfPlayers = 0;
var dealtTrumpSuit = "h";
var trumpSuit;
var dealer = 0;
var numberOfPlayersAskedAboutTrump = 0;
var numOfAsks = 0;
var goAlone=false;
var playerResponse=false;

var playerInfo = [{
    name: "Red",
    color: "red",
    background: "Coral"
  },
  {
    name: "Blue",
    color: "blue",
    background: "LightSkyBlue"
  },
  {
    name: "Green",
    color: "green",
    background: "Lime"
  },
  {
    name: "Yellow",
    color: "yellow",
    background: "#fcfce8"
  },
];
//Tell the library which element to use for the table
cards.init({
  table: '#card-table',
  type: EUCHRE
});

//DLG_TRUMP.focus();
//DLG_TRUMP.hide();

//Create a new deck of cards
deck = new cards.Deck();
//By default it's in the middle of the container, put it slightly to the side
deck.x -= 50;
//cards.all contains all cards, put them all in the deck
deck.addCards(cards.all);
//No animation here, just get the deck onto the table.
deck.render({
  immediate: true
});

//Lets add a discard pile
discardPile = new cards.Deck({
  faceUp: true
});
discardPile.x -= 40;

//Now lets create a couple of hands, one face down, one face up.
player0Hand = new cards.Hand({
  faceUp: true,
  y: 500
}); //  South
player1Hand = new cards.Hand({
  faceUp: true,
  x: 100
}); //  West
player2Hand = new cards.Hand({
  faceUp: true,
  y: 100
}); //  North
player3Hand = new cards.Hand({
  faceUp: true,
  x: 700
}); //  East
//Let's deal when the Deal button is pressed:
function deal() {
  //Deck has a built in method to deal to hands.
  BTN_DEAL.style.visibility = "hidden";
  determineWhoGoesFirst();
  numberOfPlayersAskedAboutTrump = 0;
  deck.deal(5, [player0Hand, player1Hand, player2Hand, player3Hand], 40, function() {
    //This is a callback function, called when the dealing
    //is done.
    //  send the other hands to the other players
    let i = 0;
    let theTopCard = {
      suit: deck.topCard().suit,
      rank: deck.topCard().rank
    };
    let myHand = new Array();
    for (i = 0; i < 5; i++)
      myHand[i] = {
        suit: player1Hand[i].suit,
        rank: player1Hand[i].rank
      };
    myHand[i] = theTopCard;
    sendplayerThierCards(1, myHand, dealer);
    myHand = [];
    for (i = 0; i < 5; i++)
      myHand[i] = {
        suit: player2Hand[i].suit,
        rank: player2Hand[i].rank
      };
    myHand[i] = theTopCard;
    sendplayerThierCards(2, myHand, dealer);
    myHand = [];
    for (i = 0; i < 5; i++)
      myHand[i] = {
        suit: player3Hand[i].suit,
        rank: player3Hand[i].rank
      };
    myHand[i] = theTopCard;
    sendplayerThierCards(3, myHand, dealer);

    discardPile.addCard(deck.topCard());
    discardPile.render();
/*
    //  figure out the trump suit
    dealtTrumpSuit = theTopCard.suit;
    DLG_TRUMP.value = suitConvertor.get(dealtTrumpSuit);

    //  ask player left of dealer
    let player = incrementPlayer(dealer);
    askPlayerToOrderUpDealtTrump(player, dealtTrumpSuit);

*/
  });

  gameOn = true;
}


function test() {
  console.log("test button pressed");
  //determineWinner();
  /*
  BTN_MD_TRUMP.innerHTML = suitConvertor.get(dealtTrumpSuit);
  MODALDEALT_TXT.innerHTML = "Should the dealer pick it up?"
  MODALDEALT.style.display = "block";
*/
  switch (dealtTrumpSuit) {
    case "h":
      BTN_MO_HEARTS.disabled = true;
      break;
    case "c":
      BTN_MO_CLUBS.disabled = true;
      break;
    case "d":
      BTN_MO_DIAMONDS.disabled = true;
      break;
    case "s":
      BTN_MO_SPADES.disabled = true;
      break;
  }
  MODALORDER_TXT.innerHTML = "What suit would you like as trump suit?"
  MODALORDER.style.display = "block";

  //deck.topCard().rotate(90);
} //  end test function


function determineWinner() {
  dealer = incrementDealer(dealer);
  BTN_DEAL.show();
}

function incrementPlayer(x) {
  x++;
  if (x == MAX_PLAYERS)
    x = 0;
  return x;
}

function gameOn() {
  console.log("game ON!");
  SOUTH_NAME.value = playerInfo[0].name;
  WEST_NAME.value = playerInfo[1].name;
  NORTH_NAME.value = playerInfo[2].name;
  EAST_NAME.value = playerInfo[3].name;
  SOUTH_NAME.backgroundColor = playerInfo[0].background;
  WEST_NAME.backgroundColor = playerInfo[1].background;
  NORTH_NAME.backgroundColor = playerInfo[2].background;
  EAST_NAME.backgroundColor = playerInfo[3].background;
  sendAllPlayersJoined();
  BTN_DEAL.disabled = false;
}

function determineWhoGoesFirst() {
  dealer = Math.floor(Math.random() * MAX_PLAYERS);
  DEALER.value = playerInfo[dealer].name;
  console.log("Dealer is set to: " + playerInfo[dealer].name);
}



function flipDiscardOver() {
  discardPile.faceUp = false;
  discardPile.x -= 10;
  discardPile.render();
}

function setHand(myN_Cards) {
  console.log("setting my Hand")
  deck.deal(5, [player0Hand, player1Hand, player2Hand, player3Hand], 50, function() {
    //This is a callback function, called when the dealing
    //is done.
    //  send the other hands to the other players
    let i = 0;
    for (i = 0; i < 5; i++) {
      let newSuit = myN_Cards[i].suit;
      let newRank = myN_Cards[i].rank;
      player0Hand[i].suit = newSuit;
      player0Hand[i].rank = newRank;
      player0Hand[i].shortName = newSuit + newRank;
      player0Hand[i].name = newSuit.toUpperCase() + newRank;
      player0Hand[i].showCard();
    }
    let newSuit = myN_Cards[i].suit;
    let newRank = myN_Cards[i].rank;
    let theTopCard = deck.topCard();
    theTopCard.suit = newSuit;
    theTopCard.rank = newRank;
    discardPile.addCard(theTopCard);
    discardPile.render();
    console.log("dealer is: " + DEALER.value);
  });

}
/*
//When you click on the top card of a deck, a card is added
//to your hand
deck.click(function(card){
	if (card === deck.topCard()) {
		handSouth.addCard(deck.topCard());
		handSouth.render();
	}
});
*/

//Finally, when you click a card in your hand, if it's
//the same suit or rank as the top card of the discard pile
//then it's added to it
function playCard() {}

player0Hand.click(function(card) {
  if (card.suit != playedSuit) {
    //if the player has no other cards of the playes suit, they can play any card
    for (let i = 0; i < player0Hand.length; i++) {
      if (player0Hand[i].suit == playedSuit) {
        alert("You need to play a " + suitConvertor.get(playedSuit));
        return;
      } //  end if
    } //  end for
  } //  end if
  discardPile.addCard(card);
  discardPile.render();
}); //  end function




// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  console.log("Window clicked");
  if (event.target == MODALORDER) {
    console.log("\tOrder up trump modal");
    MODALORDER.style.display = "none";
  }
  if (event.target == BTN_MO_HEARTS) {
    console.log("\tHearts selected");
    trumpSuit = "Hearts";
    goAlone= document.getElementById("orderCheckbox").checked;
    MODALORDER.style.display = "none";
  }
  if (event.target == BTN_MO_SPADES) {
    console.log("\tSpades selected");
    trumpSuit = "Spades";
    goAlone= document.getElementById("orderCheckbox").checked;
    MODALORDER.style.display = "none";
  }
  if (event.target == BTN_MO_DIAMONDS) {
    console.log("\tDiamonds selected");
    trumpSuit = "Diamonds";
    goAlone= document.getElementById("orderCheckbox").checked;
    MODALORDER.style.display = "none";
  }
  if (event.target == BTN_MO_CLUBS) {
    console.log("\tClubs selected");
    trumpSuit = "Clubs";
    goAlone= document.getElementById("modalOrderTrump").checked;
    MODALORDER.style.display = "none";
  }
  if (event.target == BTN_MD_TRUMP) {
    console.log("\tDealt suit selected");
    trumpSuit = dealtTrumpSuit;
    playerResponse=true;
    goAlone= document.getElementById("modalDealtGoAlone").checked;
    MODALDEALT.style.display = "none";
  }
  if (event.target == BTN_MD_PASS) {
    console.log("\tDealt Modal Pass selected");
    playerResponse=false;
    MODALDEALT.style.display = "none";
  }
  if (event.target == BTN_MO_PASS) {
    console.log("\Order Modal Pass selected");
    MODALORDER.style.display = "none";
  }
  if (event.target == BTN_DEAL) {
    console.log("\tDeal");
    deal();
  }
  if (event.target == BTN_TEST) {
    console.log("\ttest");
    test();
  }
  if (event.target == player0Hand) {
    console.log("\tPlay Card");
    playCard();
  }
  console.log("the Trump suit is: " + trumpSuit);
}
