const DEALER = document.getElementById('dealer');
const SUIT = document.getElementById('suit');
const suitConvertor = new Map();
suitConvertor.set("Hearts", "h");
suitConvertor.set("Clubs", "c");
suitConvertor.set("Diamonds", "d");
suitConvertor.set("Spades", "s");
var playedSuit = "Hearts";

//Tell the library which element to use for the table
cards.init({
  table: '#card-table',
  type: EUCHRE
});

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
handNorth = new cards.Hand({
  faceUp: false,
  y: 100
});
handSouth = new cards.Hand({
  faceUp: true,
  y: 500
});
handWest = new cards.Hand({
  faceUp: false,
  x: 100
});
handEast = new cards.Hand({
  faceUp: false,
  x: 700
});

//Let's deal when the Deal button is pressed:
$('#deal').click(function() {
  //Deck has a built in method to deal to hands.
  $('#deal').hide();
  deck.deal(5, [handNorth, handSouth, handWest, handEast], 50, function() {
    //This is a callback function, called when the dealing
    //is done.
    discardPile.addCard(deck.topCard());
    discardPile.render();
    console.log("dealer is: " + DEALER.value);
  });
});

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
handSouth.click(function(card) {
  if (card.suit != suitConvertor.get(playedSuit)) {
    //if the player has no other cards of the playes suit, they can play any card
    for (let i = 0; i < handSouth.length; i++) {
      if (handSouth[i].suit == suitConvertor.get(playedSuit)) {
        alert("You need to play a " + playedSuit);
        return;
      } //  end if
    } //  end for
  } //  end if
  discardPile.addCard(card);
  discardPile.render();
  handSouth.render();
}); //  end function


//So, that should give you some idea about how to render a card game.
//Now you just need to write some logic around who can play when etc...
//Good luck :)
