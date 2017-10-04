// app
import { HomeRoutes } from './home/home.routes';
import { AboutRoutes } from './about/about.routes';
import {GameRoutes} from './game/game.routes';

export const routes: Array<any> = [
  ...GameRoutes,
  ...HomeRoutes,
  ...AboutRoutes
];
