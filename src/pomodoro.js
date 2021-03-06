import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Push from 'push.js';
import { Howl } from 'howler';

import Settings from './services/settings';
import { useDispatch, useSelector } from 'react-redux';
import {
  setType,
  setTime,
  setRunning,
  setStart,
  setConfig,
  setCompact
} from './ducks/PomodoroSlice';

const electron = window.require && window.require('electron');
const remote = window.require && electron.remote;

// veja depois como que coloca o global function do electron

const types = {
  pomodoro: 'Pomodoro',
  shortBreak: 'Short Break',
  longBreak: 'Long Break'
}

export default function Pomodoro() {
  const { compact } = useSelector(state => state.pomodoro);
  if (!compact) {
    return (
      <div className="pomorodo__wrapper d-flex flex-column p-3 mt-4 rounded mb-4">
        <PomodoroTabs />
        <PomodoroClock />
        <PomodoroActions />
      </div>
    );
  }
  else {
    return (
      <div className="wrapper--pomodoro--compact d-flex flex-column p-1 pb-2 rounded">
        <PomodoroClock />
        <PomodoroActions />
      </div>
    )
  }
}

const PomodoroClock = () => {
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const {
    type,
    time,
    isRunning,
    start,
    config,
    compact
  } = useSelector(state => state.pomodoro);

  React.useEffect(() => {
    if (start === 0) {
      const initialTimestamp = Date.now();
      const end = initialTimestamp + time * 60 * 1000;
      setRemainingSeconds((end - Date.now() + 1) / 1000);
    }

    if (!isRunning) {
      return;
    }
    const countdown = setTimeout(() => {
      const end = start + time * 60 * 1000;
      const nextRemainingSeconds = (end - Date.now() + 1) / 1000;
      const sound = new Howl({
        src: config.sound
      })
      if (nextRemainingSeconds >= 0) {
        setRemainingSeconds(nextRemainingSeconds);
      } else {
        sound.play();
        Push.create("Octo-tasks", {
          body: `${types[type]} is over!`,
          tag: 'done',
          icon: '',
          timeout: 4000,
          onClick: () => {
            window.focus();
            Push.close();
          }
        });
      }
    }, 200);

    return () => clearTimeout(countdown);
  }, [remainingSeconds, config.sound, isRunning, time, type, start]);

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, 0);
  const seconds = String(Math.floor(remainingSeconds % 60)).padStart(2, 0);
  const pomodoroClass = compact ? 'pomodoro__time__compact' : 'pomorodo__time';

  React.useEffect(() => {
    document.title = `${minutes}:${seconds} ${types[type]}`
  }, [minutes, seconds, type])

  return (
    <div className={
      pomodoroClass + " d-flex justify-content-center align-items-center flex-grow-1"
    }>
      {minutes + ':' + seconds}
    </div>
  );
};

const PomodoroActions = props => {
  const [currentPause, setCurrentPause] = React.useState(0);
  const isRunning = useSelector(state => state.pomodoro.isRunning);
  const start = useSelector(state => state.pomodoro.start);
  const { compact } = useSelector(state => state.pomodoro)
  const dispatch = useDispatch();

  const startTimer = () => {
    if (start === 0) {
      dispatch(setStart(Date.now()));
    } else {
      dispatch(setStart(start + Date.now() - currentPause));
    }
    dispatch(setRunning(true));
  };

  const pauseTimer = () => {
    dispatch(setRunning(false));
    setCurrentPause(Date.now());
  };

  const resetTimer = () => {
    dispatch(setStart(0));
    dispatch(setRunning(false));
  };

  const fullMode = () => {
    remote.getGlobal("setCompactMode")();
    dispatch(setCompact(false));
  }

  return (
    <ButtonToolbar>
      <Button
        className="ml-auto mr-2"
        variant="primary"
        type="button"
        disabled={isRunning}
        onClick={startTimer}
      >
        Start
      </Button>
      <Button
        className="ml-2 mr-2"
        variant="danger"
        type="button"
        disabled={!isRunning}
        onClick={pauseTimer}
      >
        Pause
      </Button>
      <Button
        className={compact ? "ml-2 mr-2" : "mr-auto ml-2"}
        variant="secondary"
        type="button"
        onClick={resetTimer}
      >
        Reset
      </Button>
      {compact &&
        <Button
          className="mr-auto ml-2"
          variant="secondary"
          type="button"
          onClick={fullMode}
        >

          Full Mode
      </Button>
      }
    </ButtonToolbar>
  );
};

const PomodoroTabs = () => {
  const type = useSelector(state => state.pomodoro.type);
  const config = useSelector(state => state.pomodoro.config);
  const dispatch = useDispatch();

  React.useEffect(() => {
    Settings.read().then(settings => dispatch(setConfig(settings)));
  }, [dispatch]);

  const onClickTypeFn = type => () => {
    dispatch(setType(type));
  }

  React.useEffect(() => {
    dispatch(setTime(config[type]));
  }, [config, type, dispatch]);

  return (
    <ButtonToolbar className="d-none d-md-flex justify-content-around">
      <Button
        className="mb-3 col-sm-3"
        variant="primary"
        type="button"
        disabled={type === 'pomodoro'}
        onClick={onClickTypeFn('pomodoro')}
      >
        Pomodoro
      </Button>
      <Button
        className="mb-3 col-sm-3"
        variant="primary"
        type="button"
        disabled={type === 'shortBreak'}
        onClick={onClickTypeFn('shortBreak')}
      >
        Short Break
      </Button>
      <Button
        className="mb-3 col-sm-3"
        variant="primary"
        type="button"
        disabled={type === 'longBreak'}
        onClick={onClickTypeFn('longBreak')}
      >
        Long Break
      </Button>
    </ButtonToolbar>
  );
};
