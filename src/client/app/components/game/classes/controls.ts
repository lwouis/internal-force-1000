import {List} from 'immutable';

export type KeyName = string;

export class Key {
  static ArrowLeft: KeyName = 'ArrowLeft';
  static ArrowRight: KeyName = 'ArrowRight';
}

export class Controls {
  constructor(public keyboardInputs: List<KeyName>) {}

  currentDirection(): number {
    const lastKeyDown = this.keyboardInputs.last();
    if (lastKeyDown === Key.ArrowLeft) {
      return -1;
    } else if (lastKeyDown === Key.ArrowRight) {
      return 1;
    } else {
      return 0;
    }
  }
}

