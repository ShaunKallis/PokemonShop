const username = document.getElementById('username')
const pass = document.getElementById('password')
const email = document.getElementById('email')
const form = document.getElementById('form')
const errorElement = document.getElementById('error')

form.addEventListener('submit', (e) => {
    let messages = []
    
    //Check if Empty
    if (username.value == '' || username.value == null){
        messages.push('Name is required.')
    }
    
    if (pass.value == '' || pass.value == null){
        messages.push('Password is required.')
    }
    
    if (email.value == '' || email.value == null){
        messages.push('Email is required.')
    }
    
    
    //There is an error if there is a message
    if (messages >= 0){
        e.preventDefault()
        errorElement.innerText = messages.join(', ')
    }
    
    //Broswer already checks for length=6, now check for special character
    var decimal = /^(?!.*\s)$/;
    if (pass.value.match(decimal)){
        alert('Correct')
        return true
    }else{
        alert('Needs one special char')
        return false
    }
})