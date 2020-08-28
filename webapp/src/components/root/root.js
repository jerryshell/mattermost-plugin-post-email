import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {CLOSE} from '../../action_types';
import Axios from 'axios';
import {Client4} from 'mattermost-redux/client';
import {id as pluginId} from '../../manifest';

export const Root = () => {
    // store
    const dispatch = useDispatch();
    const pluginState = useSelector(state => state['plugins-' + pluginId] || {});
    const post = pluginState.post;
    const postUser = pluginState.postUser;

    // component state
    const [selectedEmailAddress, setSelectedEmailAddress] = useState([]);
    const [moreEmailAddress, setMoreEmailAddress] = useState('');
    const [userEmailList, setUserEmailList] = useState([]);

    const message = postUser ? `User: ${postUser.username}\nMessage: ${post.message}\nDate: ${new Date(post.update_at)}` : '';
    const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const finalEmailList = moreEmailAddress.split(',').map(email => email.trim()).filter(email => emailPattern.test(email)).filter(email => !selectedEmailAddress.includes(email)).concat(selectedEmailAddress);

    // fetch user list
    const fetchUserList = () => {
        Client4.autocompleteUsers('', '', '', {limit: 100}).then(response => {
            console.debug('autocompleteUsers response', response);
            const userEmailListFromServer = response.users.map(item => {
                return {
                    username: item.username,
                    email: item.email,
                };
            }).filter(userEmail => !userEmail.email.endsWith('@localhost'));
            console.debug('autocompleteUsers userEmailList map filter', userEmailListFromServer);
            setUserEmailList(userEmailListFromServer);
        });
    };

    useEffect(fetchUserList, []);

    // method
    const handleCheckboxChange = (item) => {
        const email = item.email;
        if (selectedEmailAddress.includes(email)) {
            // remove email from selectedEmailAddress
            setSelectedEmailAddress(selectedEmailAddress.filter(e => e !== email));
        } else {
            // add email to selectedEmailAddress
            setSelectedEmailAddress(selectedEmailAddress.concat(email));
        }
    };

    const handleMoreEmailAddressChange = (e) => {
        setMoreEmailAddress(e.target.value);
    };

    const handleSendClick = () => {
        // valid finalEmailList
        if (finalEmailList.length <= 0) {
            console.debug('handleSendClick finalEmailList.length <= 0');
            dispatch({type: CLOSE});
            return;
        }

        // send request to server
        const data = {
            message,
            to: finalEmailList,
        };
        console.debug('handleSendClick data', data);

        Axios.post(`/plugins/${pluginId}/sendEmail`, data).then((response) => {
            console.debug('handleSendClick response', response);
        });

        // close plugin window
        dispatch({type: CLOSE});

        // reset component state
        setSelectedEmailAddress([]);
        setMoreEmailAddress('');
    };

    const handleSelectAllClick = () => {
        setSelectedEmailAddress(userEmailList.map(userEmail => userEmail.email));
    };

    const handleResetClick = () => {
        setSelectedEmailAddress([]);
    };

    const FinalEmailList = () => {
        if (finalEmailList.length <= 0) {
            return null;
        }
        return (
            <div>
                <h2>Final Email List</h2>
                <p>{finalEmailList.join(', ')}</p>
            </div>
        );
    };

    // render
    if (!pluginState.show) {
        return null;
    }

    return (
        <div className='FullScreenModal' style={{paddingLeft: 10 + 'em'}}>
            <h1>Send Post To Email</h1>
            <p>{'Message: ' + post.message}</p>
            <button onClick={handleSelectAllClick}>Select All</button>
            <button onClick={handleResetClick} style={{marginLeft: 0.5 + 'em'}}>Reset</button>
            <ul>
                {userEmailList.map(item =>
                    <li key={item.username}>
                        <label>
                            <input type={'checkbox'} checked={selectedEmailAddress.includes(item.email)}
                                   onChange={() => handleCheckboxChange(item)}/>
                            <span style={{marginLeft: 0.5 + 'em'}}>{item.username} {item.email}</span>
                        </label>
                    </li>,
                )}
            </ul>
            <textarea rows={10} cols={100} value={moreEmailAddress} onChange={handleMoreEmailAddressChange}
                      placeholder={'More email addresses, separated by commas. Example: foo@email.com, bar@email.com'}/>
            <FinalEmailList/>
            <br/>
            <button onClick={handleSendClick}>{'Send'}</button>
            <button onClick={() => dispatch({type: CLOSE})} style={{marginLeft: 0.5 + 'em'}}>{'Close'}</button>
        </div>
    );
};
