export function numberToWords(amount: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (amount === 0) return "Zero";

  function convertGroup(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
      );
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " and " + convertGroup(n % 100) : "")
    );
  }

  const num = Math.floor(amount);
  if (num === 0) return "Zero";

  let result = "";

  if (num >= 10000000) {
    result += convertGroup(Math.floor(num / 10000000)) + " Crore ";
    amount %= 10000000;
  }

  if (num >= 100000) {
    result += convertGroup(Math.floor((num % 10000000) / 100000)) + " Lakh ";
  }

  if (num >= 1000) {
    result += convertGroup(Math.floor((num % 100000) / 1000)) + " Thousand ";
  }

  if (num % 1000 > 0) {
    result += convertGroup(num % 1000);
  }

  return result.trim() + " Only";
}
