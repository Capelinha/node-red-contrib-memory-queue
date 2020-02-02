const Rx = require('rxjs');

module.exports = function(RED) {

  // configuration
  function MemoryQueueConfig(n) {
      RED.nodes.createNode(this, n);
      this.name = n.name;
      this.onPush = new Rx.Subject();
      this._data = [];
      this._locked = false;
      this.push = function (value) {
        this._data.push(value);

        if (this._data.length === 1 && !this._locked) {
          this.emitNext();
        }
      }
      this.emitNext = function () {
        this._locked = false;
        if ( this._data.length > 0) {
          this._locked = true;
          this.onPush.next(this._data.shift());
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
      queue.push(msg.payload);
      node.send(msg);
    });
  }
  RED.nodes.registerType("memqueue in", QueueInNode);

  // queue out
  function QueueOutNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;

    const listener = queue.onPush.subscribe(function (payload) {
      node.send({ payload });
    });

    this.on('close', function(done) {
      listener.unsubscribe();
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
      queue.emitNext();
    });
  }
  RED.nodes.registerType("memqueue ack", QueueAckNode);
}