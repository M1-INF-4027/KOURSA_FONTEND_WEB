import leftImage from '/public/left.jpg'
function AdminLogin(){
    const handleLogin = ()=>{

    }
    return(<>
        <div className="w-full h-screen flex items-center justify-center ">
            <form
                className="flex flex-row justify-center bg-white w-fit rounded-2xl overflow-hidden items-stretch"
                onSubmit={handleLogin}
            >
                <div className="flex">
                    <img src={leftImage} width={450} className="block" />
                </div>

                <div className="flex flex-col gap-6 items-center justify-center w-[450px]">
                    <input type="email" name="email" placeholder="email" className="w-[70%] p-2 rounded border border-gray-300 rounded-full text-black placeholder-gray-400" />
                    <input type="password" name="password" placeholder="password" className="w-[70%] p-2 rounded border border-gray-300 rounded-full text-black placeholder-gray-400" />
                    <button type="submit" className="w-[70%] bg-[#F7B016] py-2 px-10 rounded-3xl mt-2">
                        se connecter
                    </button>
                </div>
            </form>
        </div>
    </>)
}

export default AdminLogin;