import React, { Component } from "react";
import { connect } from "react-redux";

const SHOW_NOTIFICATION_ACTION = "show_notification";
const SET_HIDE_NOTIFICATION_TIMEOUT_ACTION = "set_hide_notification_timeout";
const HIDE_NOTIFICATION_ACTION = "hide_notification";

class NotificationsComponent extends Component {
  render() {
    if (this.props.notifications && this.props.notifications.length) {
      return <div className="notifications">
        {this.props.notifications.map(({message, level, id}, ix) =>
          <div key={id} className={`notification ${level}`} onClick={this.hideNotification.bind(this, ix)}>
            {message}
          </div>
        )}
      </div>
    } else {
      return null;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    let needsHideTimeoutIx =
      (this.props.notifications || []).reduce(
        (results, {timeout}, ix) => !timeout ? results.concat(ix) : results,
        []
      );

    if (needsHideTimeoutIx.length) {
      this.props.dispatch(dispatch => {
        needsHideTimeoutIx.forEach(ix => {
          let { delay } = this.props.notifications[ix];
          // create timeout
          let timeout =
            setTimeout(
              () => dispatch({ type: HIDE_NOTIFICATION_ACTION, payload: { timeout }}),
              Math.max(1000, delay || 3000)
            );
          // set timeout id
          dispatch({ type: SET_HIDE_NOTIFICATION_TIMEOUT_ACTION, payload: { ix, timeout }});
        })
      });
    }
  }

  hideNotification(ix) {
    this.props.dispatch({ type: HIDE_NOTIFICATION_ACTION, payload: { ix } });
  }
}

function extractNotificationsState({ notifications }) {
  return { notifications };
}

function notificationsReducer(state = [], { type, payload }) {
  switch (type) {
    case SHOW_NOTIFICATION_ACTION: {
      let { message, level, id, delay } = payload;
      return state.concat({ message, level, id, delay });
    }
    case SET_HIDE_NOTIFICATION_TIMEOUT_ACTION: {
      let { ix, timeout } = payload;
      let notifications = state.slice();
      notifications[ix] = { ...notifications[ix], timeout: timeout };
      return notifications;
    }
    case HIDE_NOTIFICATION_ACTION: {
      let { ix, timeout } = payload;
      // There are two possibilities: we're hiding by index from a mouse click, or we're hiding by
      // timeout id from a timeout elapsing.
      if (timeout) {
        return state.filter(n => n.timeout !== timeout );
      } else {
        return state.slice().splice(ix, 1);
      }
    }
  }

  return state;
}

let nextId = 1;

function makeNotificationId() {
  return nextId++;
}

const NotificationLevel = {
  Error: "error",
  Warning: "warning",
  Info: "info"
};

const Notifications = connect(extractNotificationsState)(NotificationsComponent);

export {
  Notifications,
  NotificationLevel,
  notificationsReducer,
  makeNotificationId,
  SHOW_NOTIFICATION_ACTION,
  HIDE_NOTIFICATION_ACTION
};
