declare const __brand: unique symbol; // Khai báo một symbol để tạo kiểu duy nhất
type Brand<B> = { [__brand]: B }; // Gắn nhãn có kiểu B vào kiểu này để phân biệt
export type Branded<T, B> = T & Brand<B>; //xuất ra một type mới có kiểu T và nhãn B

//ví dụ
// // Định nghĩa các kiểu Branded cho USD và EUR
// type USD = Branded<number, 'USD'>;
// type EUR = Branded<number, 'EUR'>;

// // Hàm xử lý giá trị USD
// function processUSD(amount: USD) {
//   console.log(`Processing ${amount} USD`);
// }

// // Hàm xử lý giá trị EUR
// function processEUR(amount: EUR) {
//   console.log(`Processing ${amount} EUR`);
// }

// // Sử dụng các kiểu Branded
// const usdAmount = 100 as USD;
// const eurAmount = 100 as EUR;

// processUSD(usdAmount); // Hợp lệ
// processEUR(eurAmount); // Hợp lệ

// processUSD(eurAmount); // Lỗi biên dịch: EUR không thể dùng như USD
// processEUR(usdAmount); // Lỗi biên dịch: USD không thể dùng như EUR



export type Constructor<T = any, Arguments extends unknown[] = any[]> = new (
  ...arguments_: Arguments
) => T;

//ví dụ về Contructor
// class Person {
//   constructor(public name: string, public age: number) {}
// }

// // Sử dụng Constructor để định nghĩa kiểu cho lớp Person
// type PersonConstructor = Constructor<Person, [string, number]>;

// // Hàm tạo đối tượng từ một constructor
// function createInstance<T>(ctor: Constructor<T, any[]>, ...args: any[]): T {
//   return new ctor(...args);
// }

// const person = createInstance(Person, "Alice", 30);
// console.log(person.name); // Alice
// console.log(person.age);  // 30



/**
 * Wrapper type used to circumvent ESM modules circular dependency issue
 * caused by reflection metadata saving the type of the property.
 */
export type WrapperType<T> = T;




