const DEALER = document.getElementById('dealer');
const SUIT = document.getElementById('suit');
const SOUTH_NAME = document.getElementById('southName');
const WEST_NAME = document.getElementById('westName');
const NORTH_NAME = document.getElementById('northName');
const EAST_NAME = document.getElementById('eastName');
const NAMES = [SOUTH_NAME,WEST_NAME,NORTH_NAME,EAST_NAME]
const suitConvertor = new Map();
suitConvertor.set("Hearts", "h");
suitConvertor.set("Clubs", "c");
suitConvertor.set("Diamonds", "d");
suitConvertor.set("Spades", "s");

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

var playedSuit = "Hearts";
var myPlayerNumber = -1;
var turn=0;
var numOfPlayers=0;


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
cards.init({table: '#card-table',type: EUCHRE});

//Create a new deck of cards
deck = new cards.Deck();
//By default it's in the middle of the container, put it slightly to the side
deck.x -= 50;
//cards.all contains all cards, put them all in the deck
deck.addCards(cards.all);
//No animation here, just get the deck onto the table.
deck.render({immediate: true});

//Lets add a discard pile
discardPile = new cards.Deck({faceUp: true});
discardPile.x -= 40;

//Now lets create a couple of hands, one face down, one face up.
player0Hand = new cards.Hand({faceUp: true, y: 500}); //  South
player1Hand = new cards.Hand({faceUp: true, x: 100}); //  West
player2Hand = new cards.Hand({faceUp: true, y: 100}); //  North
player3Hand = new cards.Hand({faceUp: true, x: 700}); //  East

//Let's deal when the Deal button is pressed:
$('#deal').click(function() {
  //Deck has a built in method to deal to hands.
  $('#deal').hide();
  deck.deal(5, [player0Hand, player1Hand, player2Hand, player3Hand], 50, function() {
    //This is a callback function, called when the dealing
    //is done.
		//  send the other hands to the other players
		let myHand = new Array();
		for(let i=0; i<5; i++)
			myHand[i] = player1Hand[i]
		sendplayerThierCards(1,myHand);
		for(let i=0; i<5; i++)
			myHand[i] = player2Hand[i]
		sendplayerThierCards(2,myHand);
		for(let i=0; i<5; i++)
			myHand[i] = player3Hand[i]
		sendplayerThierCards(3,myHand);
		discardPile.addCard(deck.topCard());
    discardPile.render();

		//  send top card of discard pile
		//  deck.topCard()

		console.log("dealer is: " + DEALER.value);
  });


	//  determine who deals first

  //  figure out the trump suit
	gameOn = true;
});

function gameOn(){
	console.log("game ON!");
	SOUTH_NAME.value=playerInfo[0].name;
	WEST_NAME.value =playerInfo[1].name;
	NORTH_NAME.value=playerInfo[2].name;
	EAST_NAME.value =playerInfo[3].name;
	SOUTH_NAME.backgroundColor=playerInfo[0].background;
	WEST_NAME.backgroundColor =playerInfo[1].background;
	NORTH_NAME.backgroundColor=playerInfo[2].background;
	EAST_NAME.backgroundColor =playerInfo[3].background;
	sendAllPlayersJoined();
}

function determineWhoGoesFirst(){}

$('#test').click(function() {
  console.log("test button pressed");
  flipDiscardOver();
  //deck.topCard().rotate(90);
}); //  end test function

function flipDiscardOver() {
  discardPile.faceUp = false;
  discardPile.x -= 10;
  discardPile.render();
}

function setHand(myN_Cards){
	console.log("setting my Hand")
	deck.deal(5, [player0Hand, player1Hand, player2Hand, player3Hand], 50, function() {
    //This is a callback function, called when the dealing
    //is done.
		//  send the other hands to the other players
		for(let i=0; i<5; i++)
			player0Hand[i] = myN_Cards[i];
		discardPile.addCard(deck.topCard());
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
player0Hand.click(function(card) {
  if (card.suit != suitConvertor.get(playedSuit)) {
    //if the player has no other cards of the playes suit, they can play any card
    for (let i = 0; i < player0Hand.length; i++) {
      if (player0Hand[i].suit == suitConvertor.get(playedSuit)) {
        alert("You need to play a " + playedSuit);
        return;
      } //  end if
    } //  end for
  } //  end if
  discardPile.addCard(card);
  discardPile.render();
}); //  end function


//So, that should give you some idea about how to render a card game.
//Now you just need to write some logic around who can play when etc...
//Good luck :)
