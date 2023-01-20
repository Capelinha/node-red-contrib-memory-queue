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
      this._data = [];
      this._locked = false;
      this.push = function (value) {
        if (this.size > 0 && this._data.length == this.size && this.discardOnFull) {
          this._data.shift();
        }

        if (!(this.size > 0) || this._data.length < this.size) {
          this._data.push(value);

          if (this._data.length === 1 && !this._locked) {
            this.emitNext();
          }
        }
      }
      this.emitNext = function (acked = false) {
        if (acked) queue._data.shift();
        this._locked = false;
        if (this._data.length > 0) {
          this._locked = true;
          this.onPush.publish(this._data[0]);
        }
      }
  }
  RED.nodes.registerType("memory-queue", MemoryQueueConfig);

  // queue in
  function QueueInNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;
    
    node.on('input', function(msg) {
      queue.push(msg);
      node.send(msg);
    });
  }
  RED.nodes.registerType("memqueue in", QueueInNode);

  // queue out
  function QueueOutNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;

    const subscriber = function (msg) {
      node.send(msg);
    }
    queue.onPush.subscribe(subscriber);

    this.on('close', function(done) {
      queue.onPush.unsubscribe(subscriber);
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
