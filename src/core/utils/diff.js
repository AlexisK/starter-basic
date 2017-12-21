
export function diff(o, n, todos = {}) {
  todos.onInsert = todos.onInsert || (() => { });
  todos.onDelete = todos.onDelete || (() => { });
  todos.onMove = todos.onMove || (() => { });
  // console.log('Start');
  o = o.slice(); // COPY
  let ni = 0
  let oi = 0;

  for (; ni < n.length && o.length; ni++) {
    if (o[0] === n[ni]) {
      o.splice(0, 1);
      oi++;
    } else {
      let ind = o.indexOf(n[ni], 0);
      if (ind >= 0) {
        let recheck = false;

        for (let ti = 0; ti < ind; ti++) {
          let oldItemInd = n.indexOf(o[ti], ni);
          if (oldItemInd >= 0) {
            // let v = o[ti];
            // o.splice(ti, 1);
            // o.splice(ind, 0, v);
          } else {
            // console.log('DEL', o[ti]);
            todos.onDelete(o[ti], oi+ti);
            o.splice(ti, 1);
            recheck = true;
            ind--;
          }
        }

        if (recheck) {
          ni--;
        } else {
          // console.log('MOVE', n[ni], 'to', ni);
          todos.onMove(n[ni], ni + ind, ni);
          o.splice(ind, 1);
        }

      } else {
        // console.log('INSERT', n[ni], ni);
        todos.onInsert(n[ni], ni);
      }
    }
  }

  for (; ni < n.length; ni++) {
    // console.log('INSERT', n[ni], ni);
    todos.onInsert(n[ni], ni, 'end');
  }

  o.forEach((item, i) => {
    // console.log('DEL', item);
    todos.onDelete(item, oi + i, 'end');
  });
}

// var todos = {
//   onInsert: function () { console.log('INSERT', arguments); },
//   onDelete: function () { console.log('DELETE', arguments); },
//   onMove: function () { console.log('MOVE', arguments); }
// };

// diff('qwe'.split(''), 'qwer'.split(''), todos);
// diff('qwes'.split(''), 'qwwee'.split(''), todos);
// diff('qqwweessatt'.split(''), 'qqweesstt'.split(''), todos);
// diff('qwertyu'.split(''), 'qwueryt'.split(''), todos);
