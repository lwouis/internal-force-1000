import {AppComponent} from './app.component';
import {AboutComponent} from './about/about.component';
import {HomeComponent} from './home/home.component';
import {GameComponent} from './game/game.component';

export const APP_COMPONENTS: any[] = [
  AppComponent,
  GameComponent,
  AboutComponent,
  HomeComponent,
];

export * from './app.component';
export * from './game/game.component';
export * from './about/about.component';
export * from './home/home.component';
