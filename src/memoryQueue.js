class PubSub {
  constructor() {
    this.subscribers = []
  }

  subscribe(subscriber) {
    this.subscribers.push(subscriber)
  }

  unsubscribe(subscriber) {
    this.subscribers = this.subscribers.filter(sub => sub !== subscriber)
  }

  publish(msg) {
    this.subscribers.forEach(subscriber => subscriber(msg))
  }
}

module.exports = function(RED) {

  // configuration
  function MemoryQueueConfig(n) {
      RED.nodes.createNode(this, n);
      this.name = n.name;
      this.size = n.size;
      this.discardOnFull = n.discard;
      this.onPush = new PubSub();
      this.onStatusChange = new PubSub();
      this._data = [];
      this._locked = false;
      this.push = function (value) {
        if (this.size > 0 && this._data.length == this.size && this.discardOnFull) {
          this._data.shift();
        }

        if (!(this.size > 0) || this._data.length < this.size) {
          this._data.push(value);

          this.onStatusChange.publish(this._data.length);

          if (this._data.length === 1 && !this._locked) {
            this.emitNext();
          }
          return true;
        }

        return false;
      }
      this.emitNext = function (acked = false) {
        if (acked) this._data.shift();
        this._locked = false;
        if (this._data.length > 0) {
          this._locked = true;
          this.onPush.publish(this._data[0]);
        }
        
        this.onStatusChange.publish(this._data.length);
      }
  }
  RED.nodes.registerType("memory-queue", MemoryQueueConfig);

  // queue in
  function QueueInNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;
    
    node.on('input', function(msg) {
      const success = queue.push(JSON.parse(JSON.stringify(msg)));
      if (success) {
        node.status({fill: "green", shape:"dot", text:"msg enqueued"});
      } else {
        node.status({fill: "red", shape:"ring", text:"queue full"});
      }

      node.send(msg);
    });
  }
  RED.nodes.registerType("memqueue in", QueueInNode);

  // queue out
  function QueueOutNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;

    const emitMessage = function (msg) {
      node.send(JSON.parse(JSON.stringify(msg)));
    }

    const updateStatus = function (length) {
      node.status({fill: length > 0 ? "yellow" : "green", shape:"dot", text:`${length} in queue`});
    }
    updateStatus(0);

    queue.onPush.subscribe(emitMessage);
    queue.onStatusChange.subscribe(updateStatus);

    this.on('close', function(done) {
      queue.onPush.unsubscribe(emitMessage);
      queue.onStatusChange.unsubscribe(updateStatus);
      done();
    });
  }
  RED.nodes.registerType("memqueue out", QueueOutNode);

  // queue ack
  function QueueAckNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;

    node.on('input', function(msg) {
      queue.emitNext(true);
    });
  }
  RED.nodes.registerType("memqueue ack", QueueAckNode);
}
