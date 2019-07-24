import React, { Component } from "react";
import { connect } from "react-redux";

import { NewGame } from "newGame";
import { Notifications } from "notifications";
import { GameBoard } from "gameBoard";

class BogglerComponent extends Component {
  render() {
    return (
      <div>
        {this.props.gameState ? <GameBoard /> : <NewGame />}
        <Notifications />
      </div>
    );
  }
}

function extractBogglerState({ gameState }) {
  return { gameState };
}

const Boggler = connect(extractBogglerState)(BogglerComponent);

export { Boggler }
