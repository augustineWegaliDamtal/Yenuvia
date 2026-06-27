import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <div>
      <>
        <ul className='flex justify-between'>
            <Link to='/'><li>Home</li></Link>
            <Link to='/about'><li>About</li></Link>
            <Link to='/signin'><li>Signin</li></Link>
            <Link to='/signup'><li>Signup</li></Link>
            <Link to='/profile'><li>Profile</li></Link>
            <Link to='/inbox'><li>Inbox</li></Link>
            
        </ul>
      </>
    </div>
  )
}

export default Header
