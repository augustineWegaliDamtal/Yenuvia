const secret = "sk_test_91fe44ae4378dd8bdc38512438069ee6f10c8b3e";

async function test() {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "test@example.com",
      amount: 10000, // ₦100
    }),
  });

  const data = await res.json();
  console.log(data);
}

test();
