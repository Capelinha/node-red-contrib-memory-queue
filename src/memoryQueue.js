module.exports = function(RED) {

  // configuration
  function MemoryQueueConfig(n) {
      RED.nodes.createNode(this, n);
      this.name = n.name;
      this.data = [];
      this.locked = false;
  }
  RED.nodes.registerType("memory-queue", MemoryQueueConfig);

  // queue in
  function QueueInNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;
    
    node.on('input', function(msg) {
      queue.data.push(msg.payload);
      node.send(msg);
    });
  }
  RED.nodes.registerType("memqueue in", QueueInNode);

  // queue out
  function QueueOutNode(config) {
    RED.nodes.createNode(this, config);
    const queue = RED.nodes.getNode(config.queue);
    const node = this;
    const loop = setInterval(function() {
      if (queue.data.length > 0 && !queue.locked) {
        queue.locked = true;
        node.send({ payload: queue.data.shift() });
      }

      node.status({
        fill: "blue",
        shape: "dot",
        text: queue.data.length
      });
    });

    this.on('close', function(done) {
      clearInterval(loop);
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
      queue.locked = false;
      node.send(msg);
    });
  }
  RED.nodes.registerType("memqueue ack", QueueAckNode);
}