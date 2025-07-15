 // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyD-sBIfXgdii33Y8yJP4X4ZD-ifoIYj9GY",
    authDomain: "student-crew-fa076.firebaseapp.com",
    projectId: "student-crew-fa076",
    storageBucket: "student-crew-fa076.firebasestorage.app",
    messagingSenderId: "274205612819",
    appId: "1:274205612819:web:9c144ac1dadffaf43018e6"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  //submit button
  const signup = document.getElementById('submit');
  SubmitEvent.addEventListner("click",function(event){
    event.preventDefault()
    //inputs
  const fname = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirm_password = document.getElementById('confirm-password').value;
  
    createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up
    const user = userCredential.user;
    // You can add more actions here, like storing user info
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // Handle errors here (e.g., display errorMessage)
  });
    
  })



