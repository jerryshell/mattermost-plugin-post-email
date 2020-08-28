import {CLOSE, OPEN, SET_POST, SET_POST_USER} from './action_types';

export const reducer = (state = {}, action) => {
    switch (action.type) {
        case OPEN: {
            return {
                ...state,
                show: true,
            };
        }
        case CLOSE: {
            return {
                ...state,
                show: false,
            };
        }
        case SET_POST: {
            return {
                ...state,
                post: action.data,
            };
        }
        case SET_POST_USER: {
            return {
                ...state,
                postUser: action.data,
            };
        }
        default: {
            return state;
        }
    }
};
