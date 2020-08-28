import manifest from './manifest';
import {Root} from "./components/root/root";
import {reducer} from "./reducer";
import {OPEN, SET_POST, SET_POST_USER} from "./action_types";

export default class Plugin {
    initialize(registry, store) {
        registry.registerRootComponent(Root);
        registry.registerReducer(reducer);
        registry.registerPostDropdownMenuAction('Send To Email', (postID) => {
            console.log('registerPostDropdownMenuAction postID', postID);

            console.log('store.getState()', store.getState());
            store.dispatch({type: OPEN});
            console.log('store.getState()', store.getState());

            const post = store.getState().entities.posts.posts[postID];
            console.log('post', post);

            console.log('store.getState()', store.getState());
            store.dispatch({type: SET_POST, data: post});
            console.log('store.getState()', store.getState());

            const userProfiles = store.getState().entities.users.profiles;
            console.log('userProfiles', userProfiles);

            const user = userProfiles[post.user_id];
            console.log('user', user);

            console.log('store.getState()', store.getState());
            store.dispatch({type: SET_POST_USER, data: user});
            console.log('store.getState()', store.getState());
        });
    }
}

window.registerPlugin(manifest.id, new Plugin());
