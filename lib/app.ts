/**
 * The web app's entry point: registers every screen and starts the router.
 * To add a screen: create pages/<path>/page.html + page.ts, add its id to
 * ScreenId in router.ts, and register it here.
 */
import home from '../pages/home/page';
import index from '../pages/index/page';
import profile from '../pages/profile/page';
import step1 from '../pages/setup/step-1/page';
import step2 from '../pages/setup/step-2/page';
import step3 from '../pages/setup/step-3/page';
import step4 from '../pages/setup/step-4/page';
import { register, start } from './router';

register('index', index);
register('step-1', step1);
register('step-2', step2);
register('step-3', step3);
register('step-4', step4);
register('home', home);
register('profile', profile);

start();
