import type { Language } from "../../core/types";

export const templates: Record<Language, Record<string, string>> = {
  C: {
    insert: `int insert(SeqList *L, int index, int value) { // @start
  if (L->length >= CAP) return 0; // @capacity
  if (index < 0 || index > L->length) return 0;
  for (int i = L->length; i > index; i--) // @locate
    L->data[i] = L->data[i - 1]; // @shift
  L->data[index] = value; // @write
  L->length++;
  return 1; // @done
}`,
    delete: `int erase(SeqList *L, int index, int *out) { // @start
  if (index < 0 || index >= L->length) return 0;
  *out = L->data[index]; // @locate
  for (int i = index; i < L->length - 1; i++)
    L->data[i] = L->data[i + 1]; // @shift
  L->length--;
  return 1; // @done
}`,
    find: `int get(const SeqList *L, int index, int *out) { // @start
  if (index < 0 || index >= L->length) return 0;
  *out = L->data[index]; // @locate
  return 1; // @done
}`,
  },
  "C++": {
    insert: `bool insert(int *data, int &length, int index, int value) { // @start
  if (length >= CAP) return false; // @capacity
  if (index < 0 || index > length) return false;
  for (int i = length; i > index; --i) // @locate
    data[i] = data[i - 1]; // @shift
  data[index] = value; // @write
  ++length;
  return true; // @done
}`,
    delete: `bool erase(int *data, int &length, int index, int &out) { // @start
  if (index < 0 || index >= length) return false;
  out = data[index]; // @locate
  for (int i = index; i < length - 1; ++i)
    data[i] = data[i + 1]; // @shift
  --length;
  return true; // @done
}`,
    find: `bool get(const int *data, int length, int index, int &out) { // @start
  if (index < 0 || index >= length) return false;
  out = data[index]; // @locate
  return true; // @done
}`,
  },
  Python: {
    insert: `def insert(a, index, value): # @start
    if len(a) >= CAP: # @capacity
        return False
    for i in range(len(a), index, -1): # @locate
        a[i] = a[i - 1] # @shift
    a[index] = value # @write
    return True # @done`,
    delete: `def erase(a, index): # @start
    if not 0 <= index < len(a):
        return None
    out = a[index] # @locate
    for i in range(index, len(a) - 1):
        a[i] = a[i + 1] # @shift
    a.pop()
    return out # @done`,
    find: `def get(a, index): # @start
    if not 0 <= index < len(a):
        return None
    return a[index] # @locate
# 索引即偏移，一次地址计算即可 # @done`,
  },
  Go: {
    insert: `func insert(data []int, length, index, value int) int { // @start
	if length >= cap(data) { // @capacity
		return length
	}
	for i := length; i > index; i-- { // @locate
		data[i] = data[i-1] // @shift
	}
	data[index] = value // @write
	return length + 1 // @done
}`,
    delete: `func erase(data []int, length, index int) (int, int) { // @start
	if index < 0 || index >= length {
		return length, 0
	}
	out := data[index] // @locate
	for i := index; i < length-1; i++ {
		data[i] = data[i+1] // @shift
	}
	return length - 1, out // @done
}`,
    find: `func get(data []int, length, index int) int { // @start
	if index < 0 || index >= length {
		return 0
	}
	return data[index] // @locate
} // @done`,
  },
  Java: {
    insert: `int insert(int[] data, int length, int index, int value) { // @start
    if (length >= CAP) return length; // @capacity
    if (index < 0 || index > length) return length;
    for (int i = length; i > index; i--) // @locate
        data[i] = data[i - 1]; // @shift
    data[index] = value; // @write
    return length + 1; // @done
}`,
    delete: `int erase(int[] data, int length, int index) { // @start
    if (index < 0 || index >= length) return length;
    int out = data[index]; // @locate
    for (int i = index; i < length - 1; i++)
        data[i] = data[i + 1]; // @shift
    return length - 1; // @done
}`,
    find: `int get(int[] data, int length, int index) { // @start
    if (index < 0 || index >= length) return 0;
    return data[index]; // @locate
} // @done`,
  },
  Rust: {
    insert: `fn insert(data: &mut Vec<i32>, index: usize, value: i32) -> bool { // @start
    if data.len() >= CAP { // @capacity
        return false;
    }
    data.push(0); // 先在末尾占一个空槽
    for i in (index + 1..data.len()).rev() { // @locate
        data[i] = data[i - 1]; // @shift
    }
    data[index] = value; // @write
    true // @done
}`,
    delete: `fn erase(data: &mut Vec<i32>, index: usize) -> Option<i32> { // @start
    if index >= data.len() {
        return None;
    }
    let out = data[index]; // @locate
    for i in index..data.len() - 1 {
        data[i] = data[i + 1]; // @shift
    }
    data.pop();
    Some(out) // @done
}`,
    find: `fn get(data: &[i32], index: usize) -> Option<i32> { // @start
    data.get(index).copied() // @locate
} // @done`,
  },
};
