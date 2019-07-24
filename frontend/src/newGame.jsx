import React, { Component } from "react";
import { connect } from "react-redux";

import { Config } from "config";
import { makeNotificationId, NotificationLevel, SHOW_NOTIFICATION_ACTION }
  from "notifications";
import { withTimeout } from "withTimeout";
import { BogglerAPIResponse } from "bogglerAPI";

const NEW_GAME_LOADING_ACTION = "new_game_loading";
const NEW_GAME_LOADED_ACTION = "new_game_loaded";
const NEW_GAME_FAILED_ACTION = "new_game_failed";

class NewGameComponent extends Component {
  render() {
    if (this.props.loadingNewGame) {
      return <div className="loading-new-game">Loading...</div>
    } else {
      return (
        <div className="new-game">
          <button onClick={this.onNewGame.bind(this)}>Start New Game</button>
        </div>
      );
    }
  }

  onNewGame() {
    this.props.dispatch(async dispatch => {
      dispatch({ type: NEW_GAME_LOADING_ACTION, payload: { appState: { loadingNewGame: true } } });

      try {
        let response = await withTimeout(
          Config.networkTimeout,
          fetch(`${Config.apiRoot}/games`, { method: "POST" })
        );

        if (response.status !== 200) {
          NewGameComponent.newGameFailed(
            dispatch,
            `Unexpected HTTP response status: ${response.status}`
          );
        } else {
          dispatch({
            type: NEW_GAME_LOADED_ACTION,
            payload: {
              appState: { loadingNewGame: false },
              gameState: BogglerAPIResponse.toGameState(await response.json())
            }
          })
        }
      } catch (error) {
        NewGameComponent.newGameFailed(dispatch, error);
      }
    });
  }

  static newGameFailed(dispatch, error) {
    console.log(error);
    dispatch({
      type: SHOW_NOTIFICATION_ACTION,
      payload: {
        level: NotificationLevel.Error,
        message: "An error occurred trying to start a new game.",
        id: makeNotificationId()
      }
    });

    dispatch({ type: NEW_GAME_FAILED_ACTION, payload: { appState: { loadingNewGame: false } } });
  }
}

function extractNewGameState({ appState: { loadingNewGame } }) {
  return { loadingNewGame }
}

const NewGame = connect(extractNewGameState)(NewGameComponent);

export { NewGame, NewGameComponent, NEW_GAME_LOADING_ACTION, NEW_GAME_LOADED_ACTION };
