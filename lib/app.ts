/**
 * The web app's entry point: registers every screen and starts the router.
 * To add a screen: create pages/<path>/page.html + page.ts, add its id to
 * ScreenId in router.ts, and register it here.
 */
import ask from '../pages/ask/page';
import calendar from '../pages/calendar/page';
import home from '../pages/home/page';
import insights from '../pages/insights/page';
import index from '../pages/index/page';
import profile from '../pages/profile/page';
import birthday from '../pages/setup/birthday/page';
import context from '../pages/setup/context/page';
import cycle from '../pages/setup/cycle/page';
import dates from '../pages/setup/dates/page';
import name from '../pages/setup/name/page';
import { register, start } from './router';

// Setup runs: name -> birthday -> cycle -> context -> dates -> Today
register('index', index);
register('name', name);
register('birthday', birthday);
register('cycle', cycle);
register('context', context);
register('dates', dates);
register('home', home);
register('ask', ask);
register('calendar', calendar);
register('insights', insights);
register('profile', profile);

start();
