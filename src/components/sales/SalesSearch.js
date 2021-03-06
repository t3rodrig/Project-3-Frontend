import React, {useState, useEffect} from 'react'
import axios from 'axios'
import 'bulma/css/bulma.css';
import Swal from 'sweetalert2'

const SaleSearch = props => {

    const [searchState, updateSearchState] = useState({
        search:'',
    });

    const [productList, setProductList] =useState([]);

    const [saleList, updateSalesList] = useState([]);

    const [total, updateTotal] = useState(0);
    
    const getAllProducts = () => {
        axios.get(`${process.env.REACT_APP_API_URL}/products`, {withCredentials:true})
        .then(res => {
            setProductList(res.data)
        })
        .catch(err => console.log(err))
    }
    useEffect(() => {
        getAllProducts();
    },[])

    const handleChange = (event) => {  
        const { name, value } = event.target;
        updateSearchState(Object.assign({}, searchState, {[name]: value}))
    }

    const handleFormSubmit = (event) => {
        
        event.preventDefault();

        const filteredProduct = productList.filter(product =>{
            return product.barcode === searchState.search
        })

        updateSearchState({
            search:''
        })

        if(!filteredProduct[0]){
            Swal.fire({
                title: "Ups!",
                text:'Enter a valid barcode',
                icon: 'warning'
            })
        }
        if(filteredProduct[0].stock===0){
            Swal.fire({
                title: "Ups!",
                text:'This product is out of stock',
                icon: 'warning'
            })
        }
        else {

            const productArray = saleList.filter(ele=>{
                return ele._id === filteredProduct[0]._id;
            })

            if(productArray.length >0){
                const newList = saleList.map(ele=>{
                    if (ele._id === filteredProduct[0]._id) {
                        ele.quantity++;
                        ele.subtotal = ele.quantity * ele.price;
                        ele.newStock = ele.stock-ele.quantity
                        return ele;
                    } else {
                        return ele;
                    }
                })
                updateSalesList(newList)
            } else {
                filteredProduct[0].quantity=1;  
                filteredProduct[0].subtotal=filteredProduct[0].price;
                filteredProduct[0].newStock = filteredProduct[0].stock - filteredProduct[0].quantity;  
                updateSalesList([filteredProduct[0],...saleList])
            }
            
        }
    }

    const calculateTotal = () => {
        let sum =0;
        saleList.forEach(ele => {
            sum = sum + ele.subtotal
        })
        updateTotal(sum)
    }

    useEffect(() => {
        calculateTotal()
    });

    const checkout = () => {
        let saleObj = new Object()
        saleObj.sale=saleList
        saleObj.total=total
        saleObj.salesMan=props.loggedInUser._id
        saleObj.store=props.loggedInUser.store


        axios.post(`${process.env.REACT_APP_API_URL}/checkout`, saleObj, {withCredentials:true})
        .then( ()=> {
            updateSalesList([])
        })
        .catch(err => console.log(err)) 
    }

    const deleteItem = index =>{
        const newList = saleList.filter((ele, i) => i!==index)
        updateSalesList(newList)
    }

    const modifyAmount = (index, value) =>{
        const newList = saleList.map((ele,i) =>{
            if(i===index){
                ele.quantity+=value
                ele.subtotal = ele.quantity * ele.price;
                ele.newStock = ele.stock-ele.quantity
                if(ele.quantity>=ele.stock){
                    ele.quantity=ele.stock
                    ele.newStock=0
                }
            }
            return ele
        })
        
        updateSalesList(newList)


    }
    return(
        <div className='hero'>
            <div class='hero-body'>
                <div className='container'>
                    <div className='tile is-ancestor'>
                        <div className='tile is-parent' id='sale-table'>
                            <div className='tile is-child'>
                                <table className='table is-fullwidth'>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Quantity</th>
                                            <th>Subtotal</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleList.map((product,index) => {
                                            return (
                                                <tr key={product._id}>
                                                    <td>{product.name}</td>
                                                    <td>${product.price}</td>
                                                    <td>{product.newStock}</td>
                                                    <td>
                                                        <button className='button is-primary is-light is-small' onClick={()=>modifyAmount(index,-1)}>
                                                            -
                                                        </button>
                                                        {product.quantity}
                                                        <button className='button is-primary is-light is-small' onClick={()=>modifyAmount(index,1)}>
                                                            +
                                                        </button>
                                                    </td>
                                                    <td>${product.subtotal}</td>
                                                    <td><button className='button is-danger is-small' onClick={()=>deleteItem(index)}>Delete</button></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className='tile is-parent is-4 is-vertical'>
                            <div className='tile is-child'>
                                <form onSubmit={handleFormSubmit}>
                                    <div className="field has-addons">
                                        <div className="control">
                                        <input className='input' name='search' value={searchState.search} onChange={e => handleChange(e)} placeholder='Barcode here' />
                                        </div>
                                        <div className="control">
                                            <button type='submit'class="button is-info">Search</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className='tile is-child box'>
                                <p className='title is-1'>Total: ${total}</p>
                                <button className='button is-primary' onClick={checkout}>Checkout</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>



    )
}

export default SaleSearch;