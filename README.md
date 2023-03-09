# node-red-contrib-memory-queue

This node was designed to control a queue in memory.

Install
-----------
You can install this node directly from the "Manage Palette" menu in the Node-RED interface. There are no compilation steps.

```
npm install node-red-contrib-memory-queue
```

How to use
-----------
![Example Flow](/example/flow_example.png)

### Configure the queue config
Configure the queue configuration with a unique name for the queue. To create multiple queues it is necessary to create new configurations with different names.

Optionally, it is possible to limit the queue size, and to choose the desired behavior when the queue is full (whether to ignore the incoming messages or discard the oldest message in the queue and replace it with the incoming message).

![Example Configure](/example/config_example.png)

Changelog
-----------
### 3.0.0
* Add the ability to limit the queue size.
* Add an option to discard the oldest message in the queue when full and replace it with the incoming message.
* Add a new `queue resend` node type to output the same message from the queue again (instead of Acking).
* Add status messages to the `queue in` and the `queue out` nodes.
* Fix potential immutability issues through a deep clone of each message on input and output

### 2.0.0
* The entire msg object is added to the queue, not just the payload
