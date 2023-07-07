class Box {
  constructor(key, data) {
    this.key = key;
    this.data = data;
  }
}

class MinHeap {
  #nodes = [];

  static getParentPosition(index) {
    return Math.floor((index - 1) / 2);
  }

  static getLeftChildPosition(index) {
    return index * 2 + 1;
  }

  static getRightChildPosition(index) {
    return index * 2 + 2;
  }

  get size() {
    return this.#nodes.length;
  }

  swap(index1, index2) {
    const temp = this.#nodes[index1];
    this.#nodes[index1] = this.#nodes[index2];
    this.#nodes[index2] = temp;
  }

  shiftUpwards(position) {
    const node = this.#nodes[position];
    while (true) {
      let parentPosition = MinHeap.getParentPosition(position);
      if (
        this.#nodes[parentPosition] !== undefined &&
        this.#nodes[parentPosition].key > node.key
      ) {
        const temp = this.#nodes[position];
        this.#nodes[position] = this.#nodes[parentPosition];
        this.#nodes[parentPosition] = temp;
        position = parentPosition;
      } else {
        break;
      }
    }
  }

  shiftDownwards(position) {
    while (true) {
      const node = this.#nodes[position];
      const leftChild = this.#nodes[MinHeap.getLeftChildPosition(position)];
      const rightChild = this.#nodes[MinHeap.getRightChildPosition(position)];
      const diffLeft =
        (leftChild !== undefined ? leftChild.key : Number.MAX_VALUE) - node.key;
      const diffRight =
        (rightChild !== undefined ? rightChild.key : Number.MAX_VALUE) -
        node.key;
      if (diffLeft >= 0 && diffRight >= 0) {
        break;
      } else {
        const positionToSwap =
          diffLeft < diffRight
            ? MinHeap.getLeftChildPosition(position)
            : MinHeap.getRightChildPosition(position);
        this.swap(position, positionToSwap);
        position = positionToSwap;
      }
    }
  }

  insert(key, data = null) {
    this.#nodes.push(new Box(key, data));
    this.shiftUpwards(this.#nodes.length - 1);
  }

  pop() {
    let result = null;
    if (this.size > 0) {
      result = this.#nodes[0];
      const lastNode = this.#nodes[this.size - 1];
      this.#nodes.length--;
      if (this.size > 0) {
        this.#nodes[0] = lastNode;
        this.shiftDownwards(0);
      }
    }
    return result;
  }

  isValid() {
    let isValid = true;
    let i = 0;
    while (i < this.#nodes.length) {
      const leftChild = this.#nodes[MinHeap.getLeftChildPosition(i)];
      const rightChild = this.#nodes[MinHeap.getRightChildPosition(i)];
      if (
        (leftChild === undefined || leftChild.key >= this.#nodes[i].key) &&
        (rightChild === undefined || rightChild.key >= this.#nodes[i].key)
      ) {
        i++;
      } else {
        isValid = false;
        break;
      }
    }
    return isValid;
  }
}
