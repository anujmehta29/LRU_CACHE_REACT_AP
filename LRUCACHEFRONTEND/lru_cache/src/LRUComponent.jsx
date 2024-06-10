import React, { useState } from 'react';

function LRUCache() {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [expiration, setExpiration] = useState(5);
  const [cacheList, setCacheList] = useState([]);
  const [singleCache, setSingleCache] = useState({});
  const [title, setTitle] = useState('');

  const handleGet = async () => {
    if(!key || key.trim() === '') {
        setCacheList({error: 'Key is required.'});
        return;
    }
    try {
        fetch("http://localhost:8080/api/cache/" + key)
        .then(response => response.json())
        .then(data => {
            if(data.status === 404) {
                console.log('Data Not Found:', data);
                return;
            }
            setSingleCache(data.data);
            setTitle('Requested Cache:');
            console.log('Data Found:', cacheList);
        });
    } catch (error) {
      console.error('Error fetching data:', error);
      setCacheList('Error fetching data');
    }
  };

  const handleGetAll = async () => {
    try {
        fetch("http://localhost:8080/api/cache")
        .then(response => response.json())
        .then(data => {
            if(data.status === 404) {
                console.log('Data Not Found:', data);
                return;
            }
            setTitle('All Cache:');
            setCacheList(data.data);
            console.log('All Data:', cacheList);
        });
    } catch (error) {
      console.error('Error fetching data:', error);
      setCacheList('Error fetching data');
    }
  };

  const handleSet = async () => {
    if (!key || !value || !expiration || key.trim() === '' || value.trim() === '') {
      setCacheList({error: 'Key and value are required.'});
      return;
    }
    try {
      fetch("http://localhost:8080/api/cache", {
        method: 'POST',
        body: JSON.stringify({ key, value, expiration })
      }).then(response => response.json())
        .then(data => {
            if(data.status === 400) {
                return;
            }
            setSingleCache(data.data);
            setTitle('New Cache:');
            console.log('Success:', data);
        });
    } catch (error) {
      console.error('Error setting data:', error);
      setCacheList('Error setting data');
    }
  };

  const handleDelete = async () => {
    try {
      fetch("http://localhost:8080/api/cache/" + key, {
        method: 'DELETE'
      }).then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            setCacheList('Key deleted from cache');
            setTitle('Deleted Cache:');
        });
    } catch (error) {
      console.error('Error deleting data:', error);
      setCacheList('Error deleting data');
    }
  };

  return (
    <div className='main-component'>
      <h1>LRU Cache</h1>
      <div>
        <label>Key:</label>
        <input type="text" value={key} onChange={e => setKey(e.target.value)} />
      </div>
      <div>
        <label>Value:</label>
        <input type="text" value={value} onChange={e => setValue(e.target.value)} />
      </div>
      <div>
        <label>Expiration (seconds):</label>
        <input type="number" value={expiration} onChange={e => setExpiration(parseInt(e.target.value))} />
      </div>
        <div className='btns'>
            <button className='btn' onClick={handleGetAll}>Get All</button>
            <button className='btn' onClick={handleGet}>Get</button>
            <button className='btn' onClick={handleSet}>Set</button>
            <button className='btn' onClick={handleDelete}>Delete</button>
        </div>
      <div>
        <br/>
        {title ? <> 
                <h2>{title}</h2> {title === 'All Cache:' ? 
                <>
                    {
                        cacheList.map((cache, index) => {
                            return <span key={index}>Key: {cache.key}, Value: {cache.value} {cache.expiration ? ", Expiration:" : null } {cache.expiration}<br/></span>
                        })
                    }
                </> 
                :
                <><span>Key: {singleCache?.key}, Value: {singleCache?.value} {singleCache.expiration ? ", Expiration:" : null } {singleCache?.expiration}</span><br/></>
                }
            </>
        : "No data to display"}
      </div>
    </div>
  );
}

export default LRUCache;