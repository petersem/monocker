# SETUP SLACK

## 1. Create a slack app
goto https://api.slack.com/apps

![](1_slack.png)

## 2. Choose the option 'from scratch'
![](2_slack.png)

## 3. Give it a name (for example monocker1) and select a workspace.
![](3_slack.png)

## 4. Click on 'permissions'
![](4_slack.png)
![](5_slack.png)

## 5. Add correct permissions
![](6_slack.png)

## 6. Install the app to a workspace
![](7_slack.png)
![](8_slack.png)

## 7. Copy bot_user_oauth_token (!needs to start with xoxb)
![](9_slack.png)

## 8. In the slack webapp, goto the desired channel, and copy 'your_chat_id' (last part of your URL)
![](10_slack.png)


MESSAGE_PLATFORM: 'slack@bot_user_oauth_token@your_chat_id'

## EXAMPLE:

`MESSAGE_PLATFORM: 'slack@xoxb-471fz9822836-123456789-LnaSL9LdzdzdoFetdVR2hS0e@C03LKUFDE3'`



