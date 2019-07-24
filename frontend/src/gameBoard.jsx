import React, { Component } from "react";
import { connect } from "react-redux";

import { Config } from "config";
import { NewGameComponent, NEW_GAME_LOADED_ACTION } from "newGame";
import { makeNotificationId, NotificationLevel, SHOW_NOTIFICATION_ACTION }
  from "notifications";
import { withTimeout } from "withTimeout";
import { BogglerAPIResponse } from "bogglerAPI";

import "style/gameBoard.scss";

const WORD_CHANGED_ACTION = "word_changed";
const PLAYING_WORD_ACTION = "playing_word";
const PLAY_WORD_FAILED_ACTION = "play_word_failed";
const WORD_ACCEPTED_ACTION = "word_accepted";
const WORD_REJECTED_ACTION = "word_rejected";
const UPDATE_TIME_REMAINING_ACTION = "update_time_remaining";
const GAME_OVER_ACTION = "game_over";

const Keys = {
  Enter: "Enter",
  Escape: "Escape"
};

function toTimeString(seconds) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export class GameBoardComponent extends NewGameComponent {
  render() {
    return (
      <div className="game-container">
        <h1 className="title">
          <span>Boggler</span>
          <button className="restart" onClick={this.onNewGame.bind(this)}>
            <i className="material-icons">replay</i>
          </button>
        </h1>
        <div className="game">
          <div className="board">
            <table>
              <tbody>
              {this.props.board.map((row, i) =>
                <tr key={`row ${i}`}>
                  {row.map((letter, j) =>
                    <td key={`letter ${i},${j}`}
                        className={this.getLetterCSSClass(letter, i, j)}
                        onClick={this.addLetter.bind(this, letter)}>
                      <span>{letter}</span>
                    </td>
                  )}
                </tr>
              )}
              </tbody>
            </table>
          </div>
          <div className="sidebar">
            <div className="time-remaining">
              {toTimeString(this.props.timeRemaining)}
            </div>
            {this.renderWordList()}
          </div>
        </div>
        <div className="input">
          <label><span>Word:</span>
            <input
              id="word"
              type="text"
              pattern="[a-zA-Z]*"
              value={this.props.currentWord}
              ref={(input) => {
                this.wordInput = input;
              }}
              onChange={this.onWordChanged.bind(this)}
              onKeyPress={this.onKeyPress.bind(this)}
              onKeyDown={this.onKeyDown.bind(this)}/>
          </label>
          <button title="[Enter]" onClick={this.onPlayWord.bind(this, false)}>Play</button>
          <button title="[Shift]+[Enter]" onClick={this.onPlayWord.bind(this, true)}>Play & Continue</button>
        </div>
        {this.props.finalScore != null ?
          <div className="game-over">
            <div>
              <h2>Game Over</h2>
              <dl>
                <dt>Final Score</dt>
                <dd>{this.props.finalScore}</dd>
              </dl>
              <h3>Your Words</h3>
              {this.renderWordList(false, true)}
              <button onClick={this.onNewGame.bind(this)}>Play Again</button>
            </div>
          </div> :
          undefined}
      </div>
    );
  }

  renderWordList(autoScroll = true, sorted = false) {
    let words =
      sorted ?
        this.props.wordList.slice()
          .sort((w1, w2) => (w2.value.length - w1.value.length) || w1.value.localeCompare(w2.value)) :
        this.props.wordList;
    return <div className="words">
      <ul>
        {words.map((w, ix) =>
          <li key={w.value}
              className={w.accepted ? "accepted" : "pending"}
              ref={(item) => {
                if (autoScroll && ix === this.props.wordList.length - 1) {
                  this.lastWordListItem = item;
                }
              }}>
            {w.value}
            {!w.accepted && <div className="pending-indicator">[Pending]</div>}
          </li>
        )}
      </ul>
    </div>;
  }

  componentDidMount() {
    this.wordInput.focus();
    // Start countdown
    this.timer = setInterval(
      () => {
        if (this.props.timeRemaining > 0) {
          let newTimeRemaining =
            Math.round(
              Math.max(0, this.props.localExpiration - new Date()) / 1000
            );
          this.props.dispatch(async dispatch => {
            dispatch({
              type: UPDATE_TIME_REMAINING_ACTION,
              payload: {
                timeRemaining: newTimeRemaining
              }
            });
            if (newTimeRemaining === 0) {
              let response = await withTimeout(
                Config.networkTimeout,
                fetch(`${Config.apiRoot}/score`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ state_token: this.props.stateToken })
                })
              );

              if (response.status !== 200) {
                console.log(`Unexpected HTTP response status: ${response.status}`);
                dispatch({
                  type: SHOW_NOTIFICATION_ACTION,
                  payload: {
                    level: NotificationLevel.Error,
                    message: "An error occurred trying to submit a word.",
                    id: makeNotificationId()
                  }
                });
              } else {
                let { score } = await response.json();
                dispatch({
                  type: GAME_OVER_ACTION,
                  payload: { score }
                })
              }
            }
          });
        }
      },
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidUpdate() {
    if (this.lastWordListItem) {
      this.lastWordListItem.scrollIntoView();
    }
  }

  getLetterCSSClass(letter, i, j) {
    let classList = `letter-${letter}`;

    if (this.isHighlighted(i, j)) {
      classList += " highlight-letter"
    }

    return classList;
  }

  isHighlighted(i, j) {
    return this.props.highlights && this.props.highlights.includes(`${i},${j}`);
  }

  addLetter(letter) {
    this.props.dispatch({
      type: WORD_CHANGED_ACTION,
      payload: { word: this.props.currentWord + letter }
    });
  }

  onWordChanged(event) {
    this.props.dispatch({ type: WORD_CHANGED_ACTION, payload: { word: event.target.value.replace(/[^a-z]/gi, "") } });
  }

  onKeyPress(event) {
    if (event.key ===  Keys.Enter) {
      if (event.shiftKey || event.ctrlKey) {
        this.onPlayWord(true);
      } else {
        this.onPlayWord();
      }

      return false;
    }
  }

  onKeyDown(event) {
    if(event.key ===  Keys.Escape) {
      // Clear word
      this.props.dispatch({ type: WORD_CHANGED_ACTION, payload: { word: "" } });
    }
  }

  onPlayWord(continueTyping = false) {
    let word = this.props.currentWord.toLocaleLowerCase();
    if (word.length < 3) {
      this.props.dispatch({
        type: SHOW_NOTIFICATION_ACTION,
        payload: {
          level: NotificationLevel.Warning,
          message: "You must enter at least three letters to play a word.",
          id: makeNotificationId()
        }
      });
      return;
    }
    this.props.dispatch(async (dispatch) => {
      if (!continueTyping) {
        // clear the current word
        dispatch({ type: WORD_CHANGED_ACTION, payload: { word: "" } });
      }

      if (this.props.wordList.some(w => w.value === word)) {
        dispatch({
          type: SHOW_NOTIFICATION_ACTION,
          payload: {
            level: NotificationLevel.Warning,
            message: `The word "${word}" has already been played.`,
            id: makeNotificationId()
          }
        });
        return;
      }

      dispatch({ type: PLAYING_WORD_ACTION, payload: { word }});

      try {
        let response = await withTimeout(
          Config.networkTimeout,
          fetch(`${Config.apiRoot}/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state_token: this.props.stateToken, move: word })
          })
        );
        if (response.status !== 200) {
          GameBoardComponent.moveFailed(dispatch, word, `Unexpected HTTP response status: ${response.status}`);
        } else {
          let responseData = await response.json();
          let { move_valid, reason } = responseData;

          if (move_valid) {
            dispatch({
              type: WORD_ACCEPTED_ACTION,
              payload: { word, gameState: BogglerAPIResponse.toGameState(responseData) }
            });
          } else {
            dispatch({
              type: WORD_REJECTED_ACTION,
              // Refresh game state in case of clock inconsistency
              payload: { word, gameState: BogglerAPIResponse.toGameState(responseData) }
            });
            dispatch({
              type: SHOW_NOTIFICATION_ACTION,
              payload: {
                level: NotificationLevel.Warning,
                message: `"${word}" was rejected. ${reason}`,
                id: makeNotificationId()
              }
            });
          }

        }
      } catch (error) {
        GameBoardComponent.moveFailed(dispatch, word, error);
      }
    });

    this.wordInput.focus();
  }

  onNewGame() {
    super.onNewGame();
    this.wordInput.focus();
  }

  static moveFailed(dispatch, word, error) {
    console.log(error);
    dispatch({
      type: SHOW_NOTIFICATION_ACTION,
      payload: {
        level: NotificationLevel.Error,
        message: "An error occurred trying to submit a word.",
        id: makeNotificationId()
      }
    });

    dispatch({ type: PLAY_WORD_FAILED_ACTION, payload: { word } });
  }
}

function extractGameBoardState({ gameState: {
    board, wordList, timeRemaining, localExpiration, stateToken, currentWord, highlights, finalScore
  } }) {

  return {
    board,
    wordList,
    timeRemaining,
    localExpiration,
    stateToken,
    currentWord,
    highlights,
    finalScore
  };
}

function calculateHighlights(board, word) {
  let moves = [];

  if (board && word) {
    let search = [];
    {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (board[i][j] === word[0]) {
            search.push({ positions: [[i, j]], remaining: word.substr(1) });

            if (word[0] === "q" && word[1] === "u") {
              search.push({ positions: [[i, j]], remaining: word.substr(2) });
            }
          }
        }
      }
    }

    while (search.length) {
      let { positions, remaining } = search.shift();
      if (!remaining.length) {
        moves.push(...positions);
        continue;
      }
      let lastPos = positions[positions.length - 1];
      for (let i = Math.max(0, lastPos[0] - 1); i <= lastPos[0] + 1 && i < 4; i++) {
        for (let j = Math.max(0, lastPos[1] - 1); j <= lastPos[1] + 1 && j < 4; j++) {
          if (board[i][j] === remaining[0] && !positions.some(p => p[0] === i && p[1] === j)) {
            let newPositions = positions.concat([[i, j]]);
            search.push({ positions: newPositions, remaining: remaining.substr(1) });

            if (remaining[0] === "q" && remaining[1] === "u") {
              search.push({ positions: newPositions, remaining: remaining.substr(2) });
            }
          }
        }
      }
    }
  }

  // Deduplicate
  return (
    moves.sort()
      .map(pos => pos.join(","))
      .reduce((r, v) => (r[r.length - 1] !== v) ? r.concat(v) : r, [])
  );
}

function gameStateReducer(state = null, { type, payload }) {
  switch (type) {
    case NEW_GAME_LOADED_ACTION: {
      // New game replaces existing game state
      return { ...payload.gameState, currentWord: "" };
    }
    // These actions shouldn't happen when state is null
    case WORD_CHANGED_ACTION: {
      return {
        ...state,
        currentWord: payload.word,
        highlights: calculateHighlights(state.board, payload.word.toLocaleLowerCase())
      };
    }
    case PLAYING_WORD_ACTION: {
      return {
        ...state,
        wordList: state.wordList.concat({ value: payload.word, accepted: false })
      };
    }
    case WORD_REJECTED_ACTION:
    case PLAY_WORD_FAILED_ACTION: {
      return {
        ...state,
        ...payload.gameState,
        wordList: state.wordList.filter(w => w.value !== payload.word)
      };
    }
    case WORD_ACCEPTED_ACTION: {
      return {
        ...state,
        ...payload.gameState,
        wordList: state.wordList.map(w => w.value === payload.word ? { ...w, accepted: true } : w),
      };
    }
    case UPDATE_TIME_REMAINING_ACTION: {
      return { ...state, timeRemaining: payload.timeRemaining };
    }
    case GAME_OVER_ACTION: {
      return { ...state, finalScore: payload.score }
    }
  }

  return state;
}

const GameBoard = connect(extractGameBoardState)(GameBoardComponent);

export { GameBoard, gameStateReducer };
